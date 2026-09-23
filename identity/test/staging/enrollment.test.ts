/** Local PostgreSQL only. Fake delivery and synthetic accounts; no real mailbox or UV claim. */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, randomInt, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import type { Config } from "../../src/core/config.js";
import { STAGING } from "../../src/core/staging-config.js";
import { FakeEnrollmentTransport, openDelivery } from "../../src/core/delivery.js";
import { digest, opaqueToken, responseCookies } from "../../src/core/tokens.js";
import { StagingStore } from "../../src/staging/store.js";
import { stagingGrants } from "../../src/staging/grants.js";
import { assertStagingRuntime } from "../../src/staging/runtime.js";

const ownerUrl = process.env.ENROLLMENT_TEST_DATABASE_URL ?? "";
const parsed = new URL(ownerUrl);
assert.equal(parsed.hostname, "127.0.0.1");
assert.equal(parsed.port, "55432");
assert.equal(parsed.pathname, "/mirror_identity_enrollment_test");
assert.equal(parsed.username, "postgres");
assert.equal(parsed.search, "");
const owner = new Pool({ connectionString: ownerUrl });
const runtimePassword = randomBytes(32).toString("hex");
const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = STAGING.runtimeRole; runtimeUrl.password = runtimePassword;
const pool = new Pool({ connectionString: runtimeUrl.href });
const config: Config = { mode: "staging", origin: STAGING.origin, databaseUrl: runtimeUrl.href,
  secret: randomBytes(48).toString("hex"), bindHost: "127.0.0.1", port: 3040,
  oidcClientId: STAGING.clientId, redirectUris: [STAGING.redirect],
  staging: { rpId: STAGING.rpId, deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
const store = new StagingStore(pool, config);
const auth = createAuth(config, store);
const app = createApp(config, store, auth);
const operators: { pool: Pool; actor: string }[] = [];
const run = randomUUID();
const password = "Only-a-synthetic-enrollment-test-password!";
let browserNumber = randomInt(1, 60_000);
class Browser {
  headers = new Headers({ origin: config.origin });
  ip = `198.18.${Math.floor(browserNumber / 250)}.${browserNumber++ % 250 + 1}`;
  async request(path: string, body?: unknown) {
    const h = new Headers(this.headers); if (body) h.set("content-type", "application/json");
    const response = await app(new Request(config.origin + path, { method: body ? "POST" : "GET", headers: h,
      ...(body ? { body: JSON.stringify(body) } : {}) }), this.ip);
    this.headers.set("cookie", responseCookies(this.headers, response.headers).get("cookie") ?? "");
    return response;
  }
}
async function operator(index: number, sql: string, args: unknown[]) {
  const client = await operators[index]!.pool.connect();
  try {
    await client.query("BEGIN"); await client.query("SET LOCAL ROLE mirror_identity_staging_operator");
    await client.query(sql, args); await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
async function fixture(privileged = false, email = `${randomUUID()}@example.invalid`) {
  const id = `enrollment-test-${randomUUID()}`, token = opaqueToken(), epoch = "9007199254740993";
  await owner.query("INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,$2,$3)", [id, privileged, epoch]);
  await operator(0, "SELECT mirror_staging_reconcile($1,$2,$3,$4)", [id, epoch, email, `synthetic-review-${run}`]);
  await operator(0, "SELECT mirror_staging_issue($1,$2,$3,$4)", [id, epoch, digest(token), `synthetic-review-${run}`]);
  return { id, token, epoch, email };
}
async function delivered(f: Awaited<ReturnType<typeof fixture>>) {
  await store.requestMailbox(f.token);
  const transport = new FakeEnrollmentTransport();
  assert.equal(await store.dispatchOne(transport), "sent");
  const msg = [...transport.messages.values()][0]!;
  assert.equal(msg.to, f.email);
  return new URLSearchParams(new URL(msg.url).hash.slice(1)).get("mailboxToken")!;
}
before(async () => {
  await (await getMigrations(createAuth(config, new StagingStore(owner, config)).options)).runMigrations();
  await owner.query("CREATE TABLE IF NOT EXISTS mirror_schema_migration(name text PRIMARY KEY, checksum text NOT NULL)");
  for (const name of ["001-mirror-policy", "002-staging-enrollment"]) {
    const sql = await readFile(`migrations/${name}.sql`, "utf8"), checksum = createHash("sha256").update(sql).digest("hex");
    const prior = await owner.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
    if (prior.rows.length) assert.equal(prior.rows[0].checksum, checksum);
    else { await owner.query(sql); await owner.query("INSERT INTO mirror_schema_migration VALUES ($1,$2)", [name, checksum]); }
  }
  for (const role of [STAGING.runtimeRole, "mirror_identity_staging_operator"]) {
    if (!(await owner.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
      const q = await owner.query("SELECT format('CREATE ROLE %I NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',$1::text) AS sql", [role]);
      await owner.query(q.rows[0].sql);
    }
  }
  const runtime = await owner.query("SELECT format('ALTER ROLE mirror_identity_staging_runtime LOGIN PASSWORD %L',$1::text) AS sql", [runtimePassword]);
  await owner.query(runtime.rows[0].sql); await owner.query(stagingGrants);
  for (let i = 0; i < 2; i++) {
    const role = `enrollment_test_operator_${i}`, pw = randomBytes(32).toString("hex"), actor = `operator-${run}-${i}`;
    if (!(await owner.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
      await owner.query((await owner.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT',$1::text) AS sql", [role])).rows[0].sql);
    }
    await owner.query((await owner.query("SELECT format('ALTER ROLE %I PASSWORD %L',$1::text,$2::text) AS sql", [role, pw])).rows[0].sql);
    await owner.query((await owner.query("SELECT format('GRANT mirror_identity_staging_operator TO %I',$1::text) AS sql", [role])).rows[0].sql);
    await owner.query("INSERT INTO mirror_principal(id) VALUES ($1)", [actor]);
    await owner.query("INSERT INTO mirror_staging_operator(login_role,principal_id) VALUES ($1,$2) ON CONFLICT(login_role) DO UPDATE SET principal_id=EXCLUDED.principal_id", [role, actor]);
    const url = new URL(ownerUrl); url.username = role; url.password = pw;
    operators.push({ pool: new Pool({ connectionString: url.href }), actor });
  }
});
after(async () => { await Promise.all([pool.end(), owner.end(), ...operators.map(o => o.pool.end())]); });

test("runtime can start but cannot reconcile, approve, rewrite invitations or enable users", async () => {
  await assertStagingRuntime(pool);
  const f = await fixture();
  for (const sql of ["UPDATE mirror_principal SET disabled=false", "UPDATE mirror_staging_invitation SET email='bad@example.invalid'",
    "INSERT INTO mirror_staging_audit(kind) VALUES ('forged')", "SELECT mirror_staging_approve('x',0,'synthetic')",
    "SELECT mirror_staging_reconcile('x',0,'x@example.invalid','synthetic')"]) {
    await assert.rejects(pool.query(sql), /permission denied/);
  }
  assert.equal((await owner.query("SELECT epoch::text FROM mirror_staging_invitation WHERE digest=$1", [digest(f.token)])).rows[0].epoch, f.epoch);
});
test("concurrent mailbox requests create one encrypted delivery without granting access", async () => {
  const f = await fixture(); await Promise.all(Array.from({ length: 8 }, () => store.requestMailbox(f.token)));
  const rows = (await owner.query("SELECT d.*,m.token_digest FROM mirror_staging_delivery d JOIN mirror_staging_mailbox m ON m.id=d.id WHERE m.invitation_digest=$1", [digest(f.token)])).rows;
  assert.equal(rows.length, 1); assert.equal(rows[0].accepted_at, null);
  const token = openDelivery(config.staging!.deliveryKey, rows[0].id, rows[0].sealed_payload);
  assert.equal(digest(token), rows[0].token_digest);
  await assert.rejects(store.enrollWithMailbox(f.token, token, "Synthetic", "unused"), /mailbox_proof_required/);
  await owner.query("UPDATE mirror_principal SET disabled=true WHERE id=$1", [f.id]);
  assert.equal(await store.dispatchOne(new FakeEnrollmentTransport()), "idle");
});
test("mailbox delivery retries are idempotent and erase the encrypted bearer on acceptance", async () => {
  const f = await fixture(); await store.requestMailbox(f.token);
  const transport = new FakeEnrollmentTransport(); transport.failures = 1;
  assert.equal(await store.dispatchOne(transport), "retry"); assert.equal(await store.dispatchOne(transport), "sent");
  assert.equal(await store.dispatchOne(transport), "idle"); assert.equal(transport.messages.size, 1);
  const row = (await owner.query("SELECT d.* FROM mirror_staging_delivery d JOIN mirror_staging_mailbox m ON m.id=d.id WHERE m.invitation_digest=$1", [digest(f.token)])).rows[0];
  assert.equal(row.sealed_payload, null); assert.equal(row.attempts, 2); assert.ok(row.accepted_at);
});
test("enrollment races have one winner, exact principal binding, and no auto-created session", async () => {
  const f = await fixture(), mailbox = await delivered(f);
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => store.enrollWithMailbox(f.token, mailbox, "Synthetic", "unused")));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const row = (await owner.query('SELECT b.principal_id,u."emailVerified" FROM mirror_binding b JOIN "user" u ON u.id=b.user_id WHERE b.principal_id=$1', [f.id])).rows[0];
  assert.equal(row.principal_id, f.id); assert.equal(row.emailVerified, true);
  assert.equal((await owner.query('SELECT s.id FROM "session" s JOIN mirror_binding b ON b.user_id=s."userId" WHERE b.principal_id=$1', [f.id])).rowCount, 0);
});
test("disabled, changed-epoch and wrong-mailbox attempts cannot consume the invitation", async () => {
  for (const mode of ["disabled", "epoch", "mailbox"]) {
    const f = await fixture(), mailbox = await delivered(f);
    if (mode === "disabled") await owner.query("UPDATE mirror_principal SET disabled=true WHERE id=$1", [f.id]);
    if (mode === "epoch") await owner.query("UPDATE mirror_principal SET authorization_epoch=authorization_epoch+1 WHERE id=$1", [f.id]);
    await assert.rejects(store.enrollWithMailbox(f.token, mode === "mailbox" ? opaqueToken() : mailbox, "Synthetic", "unused"));
    assert.equal((await owner.query("SELECT consumed_at FROM mirror_staging_invitation WHERE digest=$1", [digest(f.token)])).rows[0].consumed_at, null);
  }
});
test("email collision rolls back both tokens and never merges principals", async () => {
  const f = await fixture(); await store.enrollWithMailbox(f.token, await delivered(f), "Synthetic", "unused");
  const second = await fixture(false, f.email), mailbox = await delivered(second);
  await assert.rejects(store.enrollWithMailbox(second.token, mailbox, "Collision", "unused"), /enrollment_conflict/);
  assert.equal((await owner.query("SELECT consumed_at FROM mirror_staging_invitation WHERE digest=$1", [digest(second.token)])).rows[0].consumed_at, null);
  assert.equal((await owner.query("SELECT user_id FROM mirror_binding WHERE principal_id=$1", [second.id])).rowCount, 0);
});
test("real password session uses secure cookies but cannot authorize a privileged account", async () => {
  const f = await fixture(true), mailbox = await delivered(f), browser = new Browser();
  const enrolled = await browser.request("/api/identity/enroll", { invitation: f.token, mailboxToken: mailbox, name: "Synthetic", password });
  assert.equal(enrolled.status, 201); assert.equal(enrolled.headers.get("set-cookie"), null);
  const login = await browser.request("/api/auth/sign-in/email", { email: f.email, password });
  assert.equal(login.status, 200); assert.match(login.headers.get("set-cookie") ?? "", /__Secure-mirror_identity.session_token=.*Secure/);
  assert.equal((await (await browser.request("/api/identity/session")).json()).mfaCompleted, false);
  assert.equal((await browser.request("/api/auth/two-factor/enable", { password })).status, 403);
  await assert.rejects(operator(0, "SELECT mirror_staging_approve($1,$2,$3)", [f.id, f.epoch, `synthetic-review-${run}`]), /independent approval required/);
  await operator(1, "SELECT mirror_staging_approve($1,$2,$3)", [f.id, f.epoch, `synthetic-review-${run}`]);
  assert.equal((await (await browser.request("/api/identity/session")).json()).mfaCompleted, false);
  const audit = (await owner.query("SELECT actor,operator_login FROM mirror_staging_audit WHERE principal_id=$1 AND kind='independent-approve'", [f.id])).rows[0];
  assert.equal(audit.actor, operators[1]!.actor); assert.equal(audit.operator_login, "enrollment_test_operator_1");
});

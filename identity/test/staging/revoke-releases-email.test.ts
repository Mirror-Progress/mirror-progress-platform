/**
 * Local PostgreSQL only (SELF_SERVE_TEST_OWNER_URL, loopback). Creates its own throwaway database
 * mirror_identity_revoke_test and simulates production before 009: Better Auth tables, then 001-008, with
 * people already revoked by the 004 function (one still holding their email, one renamed by hand by an
 * operator). The release runner (001-009) must then apply only 009, whose backfill renames the first and
 * leaves the second, removes leftover sessions and reset links, and is a no-op when run again. After 009, a
 * revoke through the runtime role releases the email at once and the same address can be invited again.
 * Synthetic data only; no mailbox or network.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import type { Config } from "../../src/core/config.js";
import { digest, opaqueToken } from "../../src/core/tokens.js";
import { StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { assertStagingRuntime } from "../../src/staging/runtime.js";
import { applyLocalPreviewSchema, LOCAL_PREVIEW_MIGRATIONS } from "../../scripts/local-preview-schema.js";

const enabled = Boolean(process.env.SELF_SERVE_TEST_OWNER_URL);
const DATABASE = "mirror_identity_revoke_test", RUNTIME = "mirror_identity_revoke_test_runtime";
const OPERATOR = "mirror_identity_revoke_test_operator";
const BEFORE_009 = LOCAL_PREVIEW_MIGRATIONS.slice(0, 8);
const runtimePassword = randomBytes(32).toString("hex");
const released = (userId: string) => `revoked-${userId}@revoked.invalid`;
let owner: Pool, runtime: Pool, store: StagingStore, config: Config;
let adminSession = "";
type Person = { principal: string; user: string; email: string };
const people = {} as Record<"oldRevoked" | "handRenamed" | "active", Person>;

/** The production runner's loop (scripts/migrate-production.ts), restricted to the migrations given. */
async function runMigrations(names: readonly string[]) {
  const client = await owner.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TABLE IF NOT EXISTS mirror_schema_migration
      (name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const name of names) {
      const sql = await readFile(`migrations/${name}.sql`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const prior = await client.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
      if (prior.rows[0] && prior.rows[0].checksum !== checksum) throw new Error("Applied checksum mismatch");
      if (!prior.rows[0]) {
        await client.query(sql);
        await client.query("INSERT INTO mirror_schema_migration(name,checksum) VALUES ($1,$2)", [name, checksum]);
      }
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

/** A bound invitation admin with a fresh passkey session, as the SQL authority checks require. */
async function invitationAdmin() {
  const principal = `revoke-test-admin-${randomUUID()}`, user = randomUUID(), session = randomUUID();
  await owner.query("INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,true,0)", [principal]);
  await owner.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt")
    VALUES ($1,'Synthetic admin',$2,true,now(),now())`, [user, `admin-${user}@mirrorprogress.com`]);
  await owner.query("INSERT INTO mirror_binding(user_id,principal_id) VALUES ($1,$2)", [user, principal]);
  await owner.query(`INSERT INTO "session"(id,token,"userId","expiresAt","createdAt","updatedAt")
    VALUES ($1,$2,$3,now()+interval '1 hour',now(),now())`, [session, randomUUID(), user]);
  await owner.query(`INSERT INTO mirror_assurance(session_id,user_id,principal_id,epoch,mfa_at,factor,expires_at)
    VALUES ($1,$2,$3,0,clock_timestamp(),'passkey_uv',now()+interval '30 minutes')`, [session, user, principal]);
  await owner.query("INSERT INTO mirror_managed_invitation_admin(principal_id) VALUES ($1)", [principal]);
  adminSession = session;
}
const sqlIssue = (target: string, email: string) => owner.query("SELECT mirror_managed_issue($1,$2,$3,$4,$5,$6,$7,$8)",
  [adminSession, target, digest(opaqueToken()), email, "Synthetic Person", "Synthetic Studio", "external", "client"]);
/** The person accepted: a Better Auth user bound to the principal, signed in, with a pending reset link. */
async function accept(principal: string, email: string): Promise<Person> {
  const user = randomUUID();
  await owner.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt")
    VALUES ($1,'Synthetic Person',$2,true,now(),now())`, [user, email]);
  await owner.query("INSERT INTO mirror_binding(user_id,principal_id) VALUES ($1,$2)", [user, principal]);
  await signIn(user);
  await owner.query(`INSERT INTO verification(id,identifier,value,"expiresAt","createdAt","updatedAt")
    VALUES ($1,$2,$3,now()+interval '1 hour',now(),now())`, [randomUUID(), `reset-password:${randomUUID()}`, user]);
  return { principal, user, email };
}
const signIn = (user: string) => owner.query(`INSERT INTO "session"(id,token,"userId","expiresAt","createdAt","updatedAt")
  VALUES ($1,$2,$3,now()+interval '1 hour',now(),now())`, [randomUUID(), randomUUID(), user]);
const userRow = async (user: string) => (await owner.query<{ email: string; emailVerified: boolean; sessions: number; resets: number }>(
  `SELECT u.email,u."emailVerified",
    (SELECT count(*) FROM "session" s WHERE s."userId"=u.id)::int AS sessions,
    (SELECT count(*) FROM verification v WHERE v.value=u.id AND v.identifier LIKE 'reset-password:%')::int AS resets
  FROM "user" u WHERE u.id=$1`, [user])).rows[0]!;
const history = async () => (await owner.query<{ name: string; checksum: string; applied_at: Date }>(
  "SELECT name,checksum,applied_at FROM mirror_schema_migration ORDER BY name")).rows;
const emails = async () => (await owner.query<{ id: string; email: string; updatedAt: Date }>(
  `SELECT id,email,"updatedAt" FROM "user" ORDER BY id`)).rows;

before(async () => {
  if (!enabled) return;
  const base = new URL(process.env.SELF_SERVE_TEST_OWNER_URL!);
  assert.equal(base.hostname, "127.0.0.1");
  process.env.IDENTITY_LOCAL_PREVIEW = "1";
  process.env.IDENTITY_MAIL_DELIVERY = "local-file";
  process.env.IDENTITY_LOCAL_PREVIEW_OUTBOX = `/tmp/revoke-test-${randomUUID()}.jsonl`;
  const maintenance = new URL(base); maintenance.pathname = "/postgres";
  const admin = new Pool({ connectionString: maintenance.href, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DATABASE}`);
  await admin.end();
  const ownerUrl = new URL(base); ownerUrl.pathname = `/${DATABASE}`;
  const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = RUNTIME; runtimeUrl.password = runtimePassword;
  config = { mode: "production", freshInstall: true, origin: "http://localhost:3040", databaseUrl: runtimeUrl.href,
    secret: randomBytes(48).toString("hex"), sessionStatusSecret: randomBytes(32).toString("hex"),
    bindHost: "127.0.0.1", port: 3040, platformOrigin: "http://127.0.0.1:3031", oidcClientId: "mirror-revoke-test",
    redirectUris: ["http://127.0.0.1:3031/api/auth/callback"],
    staging: { rpId: "localhost", deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
  owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  // Production before this release: Better Auth tables, then 001-008.
  await (await getMigrations(createAuth(config, new StagingStore(owner, config)).options)).runMigrations();
  await runMigrations(BEFORE_009);
  await invitationAdmin();
  for (const key of ["oldRevoked", "handRenamed", "active"] as const) {
    const principal = randomUUID(), email = `${key.toLowerCase()}-${principal.slice(0, 8)}@studio.example`;
    await sqlIssue(principal, email);
    people[key] = await accept(principal, email);
  }
  // Revoked with the 004 function: the email stays on the user row.
  for (const key of ["oldRevoked", "handRenamed"] as const) {
    await owner.query("SELECT mirror_managed_revoke($1,$2)", [adminSession, people[key].principal]);
  }
  // An operator renamed one by hand, and a stale session row reappeared for both (e.g. restored from a dump).
  people.handRenamed.email = `revoked-synthetic-${people.handRenamed.user}@mirrorprogress.invalid`;
  await owner.query(`UPDATE "user" SET email=$1 WHERE id=$2`, [people.handRenamed.email, people.handRenamed.user]);
  await signIn(people.oldRevoked.user); await signIn(people.handRenamed.user);
});
after(async () => { await runtime?.end(); await owner?.end(); });

test("before 009: a revoked person keeps the email and cannot be invited again", { skip: !enabled }, async () => {
  assert.equal((await userRow(people.oldRevoked.user)).email, people.oldRevoked.email);
  await assert.rejects(sqlIssue(randomUUID(), people.oldRevoked.email), { code: "42501" });
  assert.deepEqual((await history()).map(r => r.name), [...BEFORE_009]);
});

test("release runner applies only 009; its backfill renames, skips hand-renamed, and clears sessions", { skip: !enabled }, async () => {
  const beforeRun = await history();
  const activeBefore = await userRow(people.active.user);
  await applyLocalPreviewSchema(owner, config, runtimePassword, { database: DATABASE, runtimeRole: RUNTIME, operatorRole: OPERATOR });
  const afterRun = await history();
  assert.deepEqual(afterRun.map(r => r.name), [...LOCAL_PREVIEW_MIGRATIONS]);
  assert.deepEqual(afterRun.slice(0, 8), beforeRun);
  assert.equal(afterRun[8]!.name, "009-revoke-releases-email");

  assert.deepEqual(await userRow(people.oldRevoked.user),
    { email: released(people.oldRevoked.user), emailVerified: true, sessions: 0, resets: 0 });
  assert.deepEqual(await userRow(people.handRenamed.user),
    { email: people.handRenamed.email, emailVerified: true, sessions: 0, resets: 0 });
  // Active accounts are untouched.
  assert.deepEqual(await userRow(people.active.user), activeBefore);
  assert.equal(activeBefore.sessions, 1);
  // The managed invitation keeps the original address for the admin list.
  const { rows } = await owner.query("SELECT email FROM mirror_managed_invitation WHERE principal_id=$1", [people.oldRevoked.principal]);
  assert.equal(rows[0].email, people.oldRevoked.email);
});

test("009's backfill is a no-op when run again, and the runner skips it", { skip: !enabled }, async () => {
  const snapshot = await emails(), applied = await history();
  await owner.query(await readFile("migrations/009-revoke-releases-email.sql", "utf8"));
  assert.deepEqual(await emails(), snapshot);
  await runMigrations(LOCAL_PREVIEW_MIGRATIONS);
  assert.deepEqual(await history(), applied);
});

test("after 009: the runtime role passes its assertion and the revoked email can be invited again", { skip: !enabled }, async () => {
  runtime = new Pool({ connectionString: config.databaseUrl, max: 2 });
  await assertStagingRuntime(runtime, RUNTIME);
  store = new StagingStore(runtime, config);
  const reissued = await store.issueManagedInvitation(adminSession, { name: "Synthetic Person", email: people.oldRevoked.email,
    company: "Synthetic Studio", accountType: "external", role: "client" });
  assert.equal(reissued.status, "queued");
  // The hand-renamed person's original address is free too (it was never the user's email any more).
  const original = (await owner.query("SELECT email FROM mirror_managed_invitation WHERE principal_id=$1",
    [people.handRenamed.principal])).rows[0].email as string;
  assert.equal((await store.issueSelfServeInvitation({ name: "Synthetic Person", email: original, company: "Synthetic Studio" })).status, "queued");
});

test("after 009: revoke through the runtime role releases the email at once and keeps 004's effects", { skip: !enabled }, async () => {
  const email = `fresh-${randomUUID().slice(0, 8)}@studio.example`;
  const { principalId } = await store.issueManagedInvitation(adminSession, { name: "Synthetic Person", email,
    company: "Synthetic Studio", accountType: "external", role: "client" });
  const person = await accept(principalId, email);
  await owner.query(`INSERT INTO mirror_password_flow(digest,user_id,epoch,auth_cookie_digest,password_at,expires_at)
    VALUES ($1,$2,0,$3,now(),now()+interval '1 minute')`, [digest(opaqueToken()), person.user, digest(opaqueToken())]);
  assert.deepEqual(await store.revokeManagedInvitation(adminSession, principalId), { status: "revoked" });

  assert.deepEqual(await userRow(person.user), { email: released(person.user), emailVerified: true, sessions: 0, resets: 0 });
  const state = (await owner.query(`SELECT p.disabled,p.authorization_epoch::int AS epoch,m.revoked_at IS NOT NULL AS revoked,
      i.consumed_at IS NOT NULL AS consumed,d.status AS delivery,
      (SELECT count(*) FROM mirror_password_flow f WHERE f.user_id=$2)::int AS flows,
      (SELECT count(*) FROM mirror_security_outbox o WHERE o.principal_id=p.id AND o.kind='invite_revoke' AND o.epoch=1)::int AS outbox,
      (SELECT count(*) FROM mirror_staging_audit a WHERE a.principal_id=p.id AND a.kind='managed-revoke')::int AS audits
    FROM mirror_principal p JOIN mirror_managed_invitation m ON m.principal_id=p.id
    JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
    JOIN mirror_staging_mailbox b ON b.invitation_digest=i.digest JOIN mirror_staging_delivery d ON d.id=b.id
    WHERE p.id=$1`, [principalId, person.user])).rows[0];
  assert.deepEqual(state, { disabled: true, epoch: 1, revoked: true, consumed: true, delivery: "cancelled", flows: 0, outbox: 1, audits: 1 });
  // A second revoke is still refused.
  await assert.rejects(store.revokeManagedInvitation(adminSession, principalId), { code: "42501" });
  // The same email can be invited again straight away, by an admin or through self-serve.
  const again = await store.issueManagedInvitation(adminSession, { name: "Synthetic Person", email,
    company: "Synthetic Studio", accountType: "external", role: "client" });
  assert.equal(again.status, "queued");
  assert.notEqual(again.principalId, principalId);
  // The runtime role still cannot change principals itself; the function stays SECURITY DEFINER.
  await assert.rejects(runtime.query("UPDATE mirror_principal SET disabled=false WHERE id=$1", [principalId]), { code: "42501" });
  const fn = (await owner.query<{ secdef: boolean; config: string[] }>(`SELECT prosecdef AS secdef,proconfig AS config
    FROM pg_proc WHERE oid='mirror_managed_revoke(text,text)'::regprocedure`)).rows[0]!;
  assert.deepEqual(fn, { secdef: true, config: ["search_path=public, pg_temp"] });
  const publicExecute = (await owner.query<{ allowed: boolean }>(
    "SELECT has_function_privilege('public','mirror_managed_revoke(text,text)','EXECUTE') AS allowed")).rows[0]!;
  assert.equal(publicExecute.allowed, false);
});

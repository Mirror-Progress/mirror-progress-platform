/** Local PostgreSQL only. Fake delivery and synthetic accounts; no real mailbox or UV claim. */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID, randomInt, createHash } from "node:crypto";
import { readFile, mkdtemp, chmod, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyApplicationCallback } from "./application-callback.js";
import { chromium } from "playwright";
import { createIdentityHttpServer } from "../../src/core/http.js";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { hashPassword } from "better-auth/crypto";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import type { Config } from "../../src/core/config.js";
import { PRODUCTION } from "../../src/core/production-config.js";
import { STAGING } from "../../src/core/staging-config.js";
import { FakeEnrollmentTransport, openDelivery } from "../../src/core/delivery.js";
import { digest, opaqueToken, responseCookies } from "../../src/core/tokens.js";
import { StagingStore } from "../../src/staging/store.js";
import { stagingGrants, productionGrants } from "../../src/staging/grants.js";
import { assertStagingRuntime } from "../../src/staging/runtime.js";

const production = process.env.ENROLLMENT_TEST_PROFILE === "production";
assert([undefined, "staging", "production"].includes(process.env.ENROLLMENT_TEST_PROFILE));
const PROFILE = production ? PRODUCTION : STAGING;
const operatorRole = production ? "mirror_identity_production_operator" : "mirror_identity_staging_operator";
const ownerUrl = process.env.ENROLLMENT_TEST_DATABASE_URL ?? "";
const parsed = new URL(ownerUrl);
assert.equal(parsed.hostname, "127.0.0.1");
assert.equal(parsed.port, "55432");
assert.equal(parsed.pathname, production ? "/mirror_identity_production_enrollment_test" : "/mirror_identity_enrollment_test");
assert.equal(parsed.username, "postgres");
assert.equal(parsed.search, "");
const owner = new Pool({ connectionString: ownerUrl });
const runtimePassword = randomBytes(32).toString("hex");
const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = PROFILE.runtimeRole; runtimeUrl.password = runtimePassword;
const pool = new Pool({ connectionString: runtimeUrl.href });
const config: Config = { mode: production ? "production" : "staging", origin: PROFILE.origin, databaseUrl: runtimeUrl.href,
  secret: randomBytes(48).toString("hex"), sessionStatusSecret: randomBytes(48).toString("hex"), bindHost: "127.0.0.1", port: 3040,
  oidcClientId: PROFILE.clientId, redirectUris: [PROFILE.redirect],
  staging: { rpId: PROFILE.rpId, deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
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
    await client.query("BEGIN"); await client.query(`SET LOCAL ROLE ${operatorRole}`);
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
  // This dedicated synthetic database is reused, but each run has a new encryption secret.
  // Discard only its old synthetic signing keys so the library never decrypts with the wrong key.
  await owner.query("DELETE FROM jwks");
  await owner.query("CREATE TABLE IF NOT EXISTS mirror_schema_migration(name text PRIMARY KEY, checksum text NOT NULL)");
  for (const name of ["001-mirror-policy", "002-staging-enrollment", "003-assisted-recovery"]) {
    const sql = await readFile(`migrations/${name}.sql`, "utf8"), checksum = createHash("sha256").update(sql).digest("hex");
    const prior = await owner.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
    if (prior.rows.length) assert.equal(prior.rows[0].checksum, checksum);
    else { await owner.query(sql); await owner.query("INSERT INTO mirror_schema_migration VALUES ($1,$2)", [name, checksum]); }
  }
  await owner.query(`INSERT INTO "oauthClient" (id,"clientId",name,"redirectUris",scopes,"grantTypes","responseTypes","tokenEndpointAuthMethod","requirePKCE",disabled,"skipConsent","subjectType","clientCredentialsScopes","createdAt","updatedAt")
    VALUES ($1,$2,'Combined synthetic callback',$3::jsonb,'["openid","profile","email"]'::jsonb,'["authorization_code"]'::jsonb,'["code"]'::jsonb,'none',true,false,true,'public','[]'::jsonb,now(),now()) ON CONFLICT ("clientId") DO NOTHING`,
    [randomUUID(),config.oidcClientId,JSON.stringify(config.redirectUris)]);
  for (const role of [PROFILE.runtimeRole, operatorRole]) {
    if (!(await owner.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
      const q = await owner.query("SELECT format('CREATE ROLE %I NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',$1::text) AS sql", [role]);
      await owner.query(q.rows[0].sql);
    }
  }
  const runtime = await owner.query("SELECT format('ALTER ROLE %I LOGIN PASSWORD %L',$1::text,$2::text) AS sql", [PROFILE.runtimeRole, runtimePassword]);
  await owner.query(runtime.rows[0].sql); await owner.query(production ? productionGrants : stagingGrants);
  for (let i = 0; i < 2; i++) {
    const role = `enrollment_${production ? "production" : "staging"}_test_operator_${i}`, pw = randomBytes(32).toString("hex"), actor = `operator-${run}-${i}`;
    if (!(await owner.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
      await owner.query((await owner.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT',$1::text) AS sql", [role])).rows[0].sql);
    }
    await owner.query((await owner.query("SELECT format('ALTER ROLE %I PASSWORD %L',$1::text,$2::text) AS sql", [role, pw])).rows[0].sql);
    await owner.query((await owner.query("SELECT format('GRANT %I TO %I',$1::text,$2::text) AS sql", [operatorRole, role])).rows[0].sql);
    await owner.query("INSERT INTO mirror_principal(id) VALUES ($1)", [actor]);
    await owner.query("INSERT INTO mirror_staging_operator(login_role,principal_id) VALUES ($1,$2) ON CONFLICT(login_role) DO UPDATE SET principal_id=EXCLUDED.principal_id", [role, actor]);
    const url = new URL(ownerUrl); url.username = role; url.password = pw;
    operators.push({ pool: new Pool({ connectionString: url.href }), actor });
  }
});
after(async () => { await Promise.all([pool.end(), owner.end(), ...operators.map(o => o.pool.end())]); });

test("runtime can start but cannot reconcile, approve, rewrite invitations or enable users", async () => {
  await assertStagingRuntime(pool, PROFILE.runtimeRole);
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
  assert.equal(audit.actor, operators[1]!.actor); assert.equal(audit.operator_login, `enrollment_${production ? "production" : "staging"}_test_operator_1`);
  const identity = await auth.api.getSession({ headers: browser.headers }); assert.ok(identity);
  assert.equal(await store.sessionActive(identity.session.id, identity.user.id, f.id, f.epoch, true), false);
  // SQL fixture for authorization-state checks ONLY: this is not a WebAuthn ceremony or human enrollment.
  await owner.query("UPDATE mirror_assurance SET factor='passkey_uv',password_at=NULL,mfa_at=clock_timestamp() WHERE session_id=$1", [identity.session.id]);
  assert.equal(await store.sessionActive(identity.session.id, identity.user.id, f.id, f.epoch, true), true);
  assert.equal(await store.sessionActive(identity.session.id, 'another-subject', f.id, f.epoch, true), false);
  await owner.query("UPDATE mirror_principal SET authorization_epoch=authorization_epoch+1 WHERE id=$1", [f.id]);
  assert.equal(await store.sessionActive(identity.session.id, identity.user.id, f.id, f.epoch, true), false);
});

test("Chromium virtual passkey registration does not grant privilege; fresh UV after independent approval does", {
  timeout: 60_000, skip: process.env.IDENTITY_BROWSER_TESTS !== '1',
}, async () => {
  // Own isolated browser, loopback HTTPS, fake mail, synthetic users and a virtual authenticator.
  // This verifies browser/library interoperability, not human enrollment or a hardware authenticator.
  const directory = await mkdtemp(join(tmpdir(), 'mirror-identity-browser-'));
  const key = join(directory, 'key.pem'), cert = join(directory, 'cert.pem');
  const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', `/CN=${PROFILE.rpId}`, '-addext', `subjectAltName=DNS:${PROFILE.rpId}`, '-keyout', key, '-out', cert], { stdio: 'ignore' });
  assert.equal(generated.status, 0); await chmod(key, 0o600);
  // A nonprivileged loopback test port; the deployed staging allowlist is unchanged.
  const browserConfig = { ...config, origin: config.origin + ':3443' };
  const browserStore = new StagingStore(pool, browserConfig);
  const browserApp = createApp(browserConfig, browserStore, createAuth(browserConfig, browserStore));
  const server = createIdentityHttpServer(browserConfig.origin, browserApp, { key: await readFile(key), cert: await readFile(cert) });
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(3443, '127.0.0.1', resolve); });
    const browser = await chromium.launch({ headless: true, args: [`--host-resolver-rules=MAP ${PROFILE.rpId} 127.0.0.1`, '--no-proxy-server'] });
    try {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('WebAuthn.enable');
      await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
        protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true,
        isUserVerified: true, automaticPresenceSimulation: true,
      } });
      const f = await fixture(true), mailbox = await delivered(f);
      await page.goto(browserConfig.origin);
      assert.equal(await page.title(), production ? 'Mirror Identity · Sign in' : 'Mirror Identity · Staging enrollment');
      await page.locator('#enroll [name=invitation]').fill(f.token);
      await page.locator('#enroll [name=mailboxToken]').fill(mailbox);
      await page.locator('#enroll [name=name]').fill('Synthetic Browser User');
      await page.locator('#enroll [name=password]').fill(password);
      let response = page.waitForResponse(r => r.url().endsWith('/api/identity/enroll'));
      await page.locator('#enroll button').click(); assert.equal((await response).status(), 201);
      await page.locator('#login [name=email]').fill(f.email); await page.locator('#login [name=password]').fill(password);
      response = page.waitForResponse(r => r.url().endsWith('/api/auth/sign-in/email'));
      await page.locator('#login button').click(); assert.equal((await response).status(), 200);
      response = page.waitForResponse(r => r.url().endsWith('/api/auth/passkey/verify-registration'));
      await page.locator('#passkey-register').click(); assert.equal((await response).status(), 200);
      let state = await page.evaluate(async () => (await fetch('/api/identity/session')).json());
      assert.equal(state.mfaCompleted, false);
      response = page.waitForResponse(r => r.url().endsWith('/api/auth/passkey/verify-authentication'));
      await page.locator('#passkey-signin').click(); assert.equal((await response).status(), 200);
      state = await page.evaluate(async () => (await fetch('/api/identity/session')).json()); assert.equal(state.mfaCompleted, false);
      await operator(1, "SELECT mirror_staging_approve($1,$2,$3)", [f.id, f.epoch, `synthetic-browser-review-${run}`]);
      state = await page.evaluate(async () => (await fetch('/api/identity/session')).json()); assert.equal(state.mfaCompleted, false);
      response = page.waitForResponse(r => r.url().endsWith('/api/auth/passkey/verify-authentication'));
      await page.locator('#passkey-signin').click(); assert.equal((await response).status(), 200);
      state = await page.evaluate(async () => (await fetch('/api/identity/session')).json());
      assert.equal(state.mfaCompleted, true); assert.equal(state.principalId, f.id); assert.equal(state.assurance.method, 'passkey_uv');
      const revoke = async () => {
        await page.locator('#global-logout').click();
        await page.waitForFunction(async () => (await fetch('/api/identity/session')).status === 401);
      };
      if (production && process.env.IDENTITY_TEST_APP_ROOT) {
        await verifyApplicationCallback({root:process.env.IDENTITY_TEST_APP_ROOT,config:browserConfig,app:browserApp,page,owner,principalId:f.id,email:f.email,revoke});
      } else await revoke();
    } finally { await browser.close(); }
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("assisted recovery needs two operators, has one atomic winner, revokes sessions and preserves identity", async () => {
  const f = await fixture(true), mailbox = await delivered(f), browser = new Browser();
  assert.equal((await browser.request('/api/identity/enroll', { invitation: f.token, mailboxToken: mailbox, name: 'Recovery fixture', password })).status, 201);
  assert.equal((await browser.request('/api/auth/sign-in/email', { email: f.email, password })).status, 200);
  const identity = await auth.api.getSession({ headers: browser.headers }); assert.ok(identity);
  const requestId = randomUUID(), newPassword = opaqueToken(), hash = await hashPassword(newPassword);
  await operator(0, 'SELECT mirror_staging_request_recovery($1,$2,$3,$4,$5)', [requestId, f.id, f.epoch, hash, `synthetic-recovery-${run}`]);
  await assert.rejects(pool.query('SELECT mirror_staging_approve_recovery($1,$2)', [requestId, 'synthetic-denied']), /permission denied/);
  await assert.rejects(operator(0, 'SELECT mirror_staging_approve_recovery($1,$2)', [requestId, `synthetic-recovery-${run}`]), /independent recovery approval required/);
  const result = await Promise.allSettled(Array.from({ length: 4 }, () => operator(1, 'SELECT mirror_staging_approve_recovery($1,$2)', [requestId, `synthetic-recovery-${run}`])));
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await browser.request('/api/identity/session')).status, 401);
  const principal = (await owner.query('SELECT id,disabled,authorization_epoch::text AS epoch FROM mirror_principal WHERE id=$1', [f.id])).rows[0];
  assert.equal(principal.id, f.id); assert.equal(principal.disabled, false); assert.equal(principal.epoch, '9007199254740994');
  assert.equal((await owner.query('SELECT user_id FROM mirror_binding WHERE principal_id=$1', [f.id])).rows[0].user_id, identity.user.id);
  const recovery = (await owner.query('SELECT password_hash,consumed_at FROM mirror_staging_recovery WHERE id=$1', [requestId])).rows[0];
  assert.equal(recovery.password_hash, null); assert.ok(recovery.consumed_at);
  const next = new Browser();
  assert.equal((await next.request('/api/auth/sign-in/email', { email: f.email, password: newPassword })).status, 200);
  assert.equal((await (await next.request('/api/identity/session')).json()).mfaCompleted, false);
  assert.equal((await owner.query("SELECT count(*) FROM mirror_security_outbox WHERE principal_id=$1 AND kind='recovery'", [f.id])).rows[0].count, '1');
});
test("disabled or changed-epoch recovery approvals fail without changing credentials or enabling the principal", async () => {
  for (const mode of ['disabled', 'epoch']) {
    const f = await fixture(), mailbox = await delivered(f);
    await store.enrollWithMailbox(f.token, mailbox, 'Recovery reject fixture', 'original-synthetic-hash');
    const id = randomUUID();
    await operator(0, 'SELECT mirror_staging_request_recovery($1,$2,$3,$4,$5)', [id, f.id, f.epoch, await hashPassword(opaqueToken()), `synthetic-recovery-${run}`]);
    await owner.query(mode === 'disabled' ? 'UPDATE mirror_principal SET disabled=true WHERE id=$1' : 'UPDATE mirror_principal SET authorization_epoch=authorization_epoch+1 WHERE id=$1', [f.id]);
    await assert.rejects(operator(1, 'SELECT mirror_staging_approve_recovery($1,$2)', [id, `synthetic-recovery-${run}`]), /independent recovery approval required/);
    assert.equal((await owner.query('SELECT a.password FROM "account" a JOIN mirror_binding b ON b.user_id=a."userId" WHERE b.principal_id=$1', [f.id])).rows[0].password, 'original-synthetic-hash');
    assert.equal((await owner.query('SELECT consumed_at FROM mirror_staging_recovery WHERE id=$1', [id])).rows[0].consumed_at, null);
  }
});

test('fresh production policy removes migration approval only, retaining mailbox, passkey and revocation checks', async () => {
  const f = await fixture(true), mailbox = await delivered(f);
  const fresh = new StagingStore(pool,{...config,freshInstall:true});
  const enrolled = await fresh.enrollWithMailbox(f.token, mailbox, 'Fresh synthetic owner', await hashPassword(password));
  if(production)assert.equal(enrolled.userId,f.id);
  const browser = new Browser();assert.equal((await browser.request('/api/auth/sign-in/email',{email:f.email,password})).status,200);
  const identity = await auth.api.getSession({headers:browser.headers});assert.ok(identity);
  assert.equal(await fresh.sessionActive(identity.session.id,enrolled.userId,f.id,f.epoch,true),false);
  // State fixture only, not a passkey-ceremony claim; existing Chromium test verifies actual UV.
  await owner.query("UPDATE mirror_assurance SET factor='passkey_uv',password_at=NULL,mfa_at=clock_timestamp() WHERE session_id=$1",[identity.session.id]);
  assert.equal(await fresh.sessionActive(identity.session.id,enrolled.userId,f.id,f.epoch,true),production);
  if(production)assert.equal((await fresh.authorize(identity.session.id)).principal.id,f.id);
  else await assert.rejects(fresh.authorize(identity.session.id));
  await assert.rejects(store.authorize(identity.session.id));
  await owner.query('UPDATE "user" SET "emailVerified"=false WHERE id=$1',[enrolled.userId]);
  assert.equal(await fresh.sessionActive(identity.session.id,enrolled.userId,f.id,f.epoch,true),false);
  await assert.rejects(fresh.authorize(identity.session.id));
});

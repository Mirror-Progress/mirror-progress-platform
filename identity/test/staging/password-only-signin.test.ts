/**
 * Local PostgreSQL only (SELF_SERVE_TEST_OWNER_URL, loopback). Creates its own throwaway database
 * mirror_identity_password_only_test, applies migrations 001-006 and 008 with least-privilege grants,
 * then drives the real HTTP routes: invitation acceptance, password sign-in, session status, OIDC
 * code flow and the migration 008 database guard. Fake delivery; no mailbox or network.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { Config } from "../../src/core/config.js";
import { FakeEnrollmentTransport } from "../../src/core/delivery.js";
import { responseCookies } from "../../src/core/tokens.js";
import { StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import { applyLocalPreviewSchema } from "../../scripts/local-preview-schema.js";

const enabled = Boolean(process.env.SELF_SERVE_TEST_OWNER_URL);
const DATABASE = "mirror_identity_password_only_test", RUNTIME = "mirror_identity_password_only_test_runtime";
const ORIGIN = "http://localhost:3040", REDIRECT = "http://127.0.0.1:3031/api/auth/callback";
const runtimePassword = randomBytes(32).toString("hex");
const password = "correct horse battery staple 42";
let owner: Pool, runtime: Pool, store: StagingStore, app: ReturnType<typeof createApp>, config: Config;

before(async () => {
  if (!enabled) return;
  const base = new URL(process.env.SELF_SERVE_TEST_OWNER_URL!);
  assert.equal(base.hostname, "127.0.0.1");
  process.env.IDENTITY_LOCAL_PREVIEW = "1";
  process.env.IDENTITY_MAIL_DELIVERY = "local-file";
  process.env.IDENTITY_LOCAL_PREVIEW_OUTBOX = `/tmp/password-only-test-${randomUUID()}.jsonl`;
  const maintenance = new URL(base); maintenance.pathname = "/postgres";
  const admin = new Pool({ connectionString: maintenance.href, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DATABASE}`);
  await admin.end();
  const ownerUrl = new URL(base); ownerUrl.pathname = `/${DATABASE}`;
  const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = RUNTIME; runtimeUrl.password = runtimePassword;
  config = { mode: "production", freshInstall: true, origin: ORIGIN, databaseUrl: runtimeUrl.href,
    secret: randomBytes(48).toString("hex"), sessionStatusSecret: randomBytes(32).toString("hex"),
    bindHost: "127.0.0.1", port: 3040, platformOrigin: "http://127.0.0.1:3031", oidcClientId: "mirror-password-only-test",
    redirectUris: [REDIRECT],
    staging: { rpId: "localhost", deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
  owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  await applyLocalPreviewSchema(owner, config, runtimePassword,
    { database: DATABASE, runtimeRole: RUNTIME, operatorRole: "mirror_identity_password_only_test_operator" });
  runtime = new Pool({ connectionString: runtimeUrl.href, max: 4 });
  store = new StagingStore(runtime, config);
  app = createApp(config, store, createAuth(config, store));
});
after(async () => { await runtime?.end(); await owner?.end(); });

/** A minimal same-origin browser: one cookie jar, JSON bodies, no redirects followed. */
function browser(ip: string) {
  let jar = new Headers();
  return {
    get cookies() { return jar; },
    async request(path: string, body?: unknown, init: { form?: string } = {}) {
      const headers = new Headers(jar);
      if (body !== undefined || init.form !== undefined) headers.set("origin", ORIGIN);
      if (body !== undefined) headers.set("content-type", "application/json");
      if (init.form !== undefined) { headers.set("content-type", "application/x-www-form-urlencoded"); headers.delete("origin"); }
      const response = await app(new Request(ORIGIN + path, { method: body === undefined && init.form === undefined ? "GET" : "POST",
        headers, ...(body !== undefined ? { body: JSON.stringify(body) } : init.form !== undefined ? { body: init.form } : {}) }), ip);
      jar = responseCookies(jar, response.headers);
      return response;
    },
  };
}

/** Issues an external/client invitation, delivers it to the fake transport and accepts it over HTTP. */
async function acceptInvitation(email: string, ip: string, beforeAccept?: (principalId: string) => Promise<void>) {
  const issued = await store.issueSelfServeInvitation({ name: "Sample Person", email, company: `Company ${email}` });
  assert.equal(issued.status, "queued");
  const principalId = (issued as { principalId: string }).principalId;
  await beforeAccept?.(principalId);
  const transport = new FakeEnrollmentTransport();
  while (await store.dispatchOne(transport) === "sent") { /* drain */ }
  const message = [...transport.messages.values()].find((item) => item.to === email)!;
  const token = decodeURIComponent(new URL(message.url).hash.replace("#invitation=", ""));
  const client = browser(ip);
  const enrolled = await client.request("/api/identity/enroll", { invitation: token, mailboxToken: token, name: "Sample Person", password });
  assert.equal(enrolled.status, 201);
  return { client, principalId };
}

test("an external client completes acceptance and signs in with a password alone", { skip: !enabled }, async () => {
  const email = "client@sample-password.example";
  const { client, principalId } = await acceptInvitation(email, "198.18.0.1");
  const login = await client.request("/api/auth/sign-in/email", { email, password });
  assert.equal(login.status, 200);
  assert.equal((await login.json() as Record<string, unknown>).signedIn, true);
  const state = await (await client.request("/api/identity/session")).json() as Record<string, any>;
  assert.equal(state.mfaCompleted, true, JSON.stringify(state));
  assert.equal(state.assurance.method, "password");
  assert.equal(state.passkeyOptional, true);
  assert.equal(state.passkeyRegistered, false);
  assert.equal(state.accountType, "external");
  const session = await createAuth(config, store).api.getSession({ headers: client.cookies });
  assert.ok(session);
  // The platform's session-status and managed-profile checks accept the password-only session.
  assert.equal(await store.sessionActive(session.session.id, session.user.id, principalId, "0"), true);
  assert.equal(await store.sessionActive(session.session.id, session.user.id, principalId, "0", true), false);
  assert.equal((await store.managedProfile(session.session.id, session.user.id, principalId, "0"))?.accountType, "external");
  // A passkey stays available: the freshly signed-in client may register one ("faster sign-in").
  assert.equal((await client.request("/api/auth/passkey/generate-register-options")).status, 200);

  // OIDC code flow to Prospect works and carries the password method in the assurance claim.
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const query = new URLSearchParams({ client_id: config.oidcClientId, redirect_uri: REDIRECT, response_type: "code",
    scope: "openid profile email", state: randomBytes(16).toString("hex"), nonce: randomBytes(16).toString("hex"),
    code_challenge: challenge, code_challenge_method: "S256" });
  const authorize = await client.request(`/api/auth/oauth2/authorize?${query}`);
  const location = new URL(authorize.headers.get("location") ?? "", ORIGIN);
  assert.equal(location.origin + location.pathname, REDIRECT, `authorize -> ${authorize.status} ${location.href}`);
  const code = location.searchParams.get("code")!;
  const exchanged = await app(new Request(`${ORIGIN}/api/auth/oauth2/token`, { method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: config.oidcClientId, redirect_uri: REDIRECT,
      code, code_verifier: verifier }).toString() }), "198.18.0.1");
  assert.equal(exchanged.status, 200);
  const tokens = await exchanged.json() as { id_token: string };
  const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1]!, "base64url").toString("utf8"));
  const assurance = claims["https://mirrorprogress.com/assurance"];
  assert.equal(assurance.method, "password");
  assert.equal(assurance.password_verified_at, assurance.verified_at);

  // Password-only evidence must be a single ceremony (password time = authentication time).
  await assert.rejects(runtime.query(`UPDATE mirror_assurance SET mfa_at=password_at+interval '1 second'
    WHERE session_id=$1`, [session.session.id]), { code: "23514" });
  // Revoking the invitation ends password-only authorization.
  await owner.query("UPDATE mirror_managed_invitation SET revoked_at=clock_timestamp() WHERE principal_id=$1", [principalId]);
  assert.equal((await (await client.request("/api/identity/session")).json() as Record<string, unknown>).mfaCompleted, false);
  assert.equal(await store.sessionActive(session.session.id, session.user.id, principalId, "0"), false);
});

test("admin accounts still require a passkey after password sign-in", { skip: !enabled }, async () => {
  const email = "admin@sample-password.example";
  // SQL fixture: turn the queued invitation into a privileged admin invitation before acceptance.
  const { client, principalId } = await acceptInvitation(email, "198.18.0.2", async (id) => {
    await owner.query("UPDATE mirror_principal SET privileged=true WHERE id=$1", [id]);
    await owner.query(`UPDATE mirror_managed_invitation SET account_type='admin',requested_role='admin',company_name='Mirror Progress'
      WHERE principal_id=$1`, [id]);
  });
  const login = await client.request("/api/auth/sign-in/email", { email, password });
  assert.equal(login.status, 200);
  assert.equal((await login.json() as Record<string, unknown>).signedIn, undefined);
  const state = await (await client.request("/api/identity/session")).json() as Record<string, unknown>;
  assert.equal(state.mfaCompleted, false);
  assert.equal(state.reason, "privileged_passkey_required");
  assert.equal(state.passkeyOptional, false);
  const session = await createAuth(config, store).api.getSession({ headers: client.cookies });
  assert.ok(session);
  assert.equal(await store.sessionActive(session.session.id, session.user.id, principalId, "0"), false);
  // The runtime role cannot record password-only assurance for an admin (migration 008 trigger).
  await assert.rejects(runtime.query(`UPDATE mirror_assurance SET factor='password',mfa_at=password_at WHERE session_id=$1`,
    [session.session.id]), { code: "42501" });
  // The authorize endpoint refuses to issue a code without the admin's passkey.
  const query = new URLSearchParams({ client_id: config.oidcClientId, redirect_uri: REDIRECT, response_type: "code",
    scope: "openid", state: randomBytes(16).toString("hex"), nonce: randomBytes(16).toString("hex"),
    code_challenge: randomBytes(32).toString("base64url").slice(0, 43), code_challenge_method: "S256" });
  const authorize = await client.request(`/api/auth/oauth2/authorize?${query}`);
  assert.equal(authorize.status, 401);
  assert.equal((await authorize.json() as Record<string, unknown>).error, "privileged_passkey_required");
});

test("password-only sign-in is not available outside the production fresh-install profile", { skip: !enabled }, async () => {
  const staged = new StagingStore(runtime, { ...config, freshInstall: false });
  const { rows } = await owner.query<{ user_id: string }>(`SELECT b.user_id FROM mirror_binding b
    JOIN mirror_managed_invitation m ON m.principal_id=b.principal_id WHERE m.email='client@sample-password.example'`);
  assert.equal(await staged.passwordOnlyEligible(rows[0]!.user_id), false);
});

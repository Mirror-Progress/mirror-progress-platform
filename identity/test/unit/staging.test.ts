import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { loadConfig, assertRuntimeEnvironment } from "../../src/core/config.js";
import { STAGING, stagingDatabase } from "../../src/core/staging-config.js";
import { assertStagingAuthorized, decimalEpoch, enrollmentMessage } from "../../src/core/staging-policy.js";
import type { EnrollmentProof, OperatorApproval } from "../../src/core/staging-policy.js";
import type { Evidence, Principal } from "../../src/core/policy.js";
import { sealDelivery, openDelivery, FakeEnrollmentTransport } from "../../src/core/delivery.js";
import { cleanAuthHeaders, cookieValue, opaqueToken } from "../../src/core/tokens.js";
import { createIdentityHttpServer } from "../../src/core/http.js";
const env = { IDENTITY_MODE: "staging", IDENTITY_ORIGIN: STAGING.origin, IDENTITY_RP_ID: STAGING.rpId,
  IDENTITY_OIDC_CLIENT_ID: STAGING.clientId, IDENTITY_REDIRECT_URIS: JSON.stringify([STAGING.redirect]),
  DATABASE_URL: "postgresql://mirror_identity_staging_runtime:synthetic-only@localhost/mirror_identity_staging",
  BETTER_AUTH_SECRET: "synthetic-auth-key-".repeat(4), IDENTITY_DELIVERY_KEY: randomBytes(32).toString("base64url"),
  IDENTITY_TLS_CERT_FILE: "/synthetic/server.crt", IDENTITY_TLS_KEY_FILE: "/synthetic/server.key" };
test("staging requires the exact explicit trust bundle and TLS files", () => {
  const c = loadConfig(env); assert.equal(c.mode, "staging"); assert.equal(c.staging?.rpId, STAGING.rpId);
  assert.equal(c.origin, STAGING.origin); assert.deepEqual(c.redirectUris, [STAGING.redirect]);
});
for (const [key, value] of Object.entries({ IDENTITY_MODE: "production", IDENTITY_ORIGIN: "https://accounts.mirrorprogress.com",
  IDENTITY_RP_ID: "mirrorprogress.com", IDENTITY_OIDC_CLIENT_ID: "mirror-production",
  IDENTITY_REDIRECT_URIS: JSON.stringify([STAGING.redirect + "/"]), IDENTITY_TLS_CERT_FILE: "relative.crt",
  IDENTITY_DELIVERY_KEY: "invalid", IDENTITY_BIND_HOST: "0.0.0.0" })) {
  test(`staging fails closed for ${key}`, () => assert.throws(() => loadConfig({ ...env, [key]: value })));
}
for (const origin of [STAGING.origin + "/", STAGING.origin.replace("https:", "http:"), "https://*.staging.mirrorprogress.com"]) {
  test(`rejects nonexact origin ${origin}`, () => assert.throws(() => loadConfig({ ...env, IDENTITY_ORIGIN: origin })));
}
for (const url of ["bad URL", "postgresql://owner:pw@localhost/mirror_identity_staging",
  env.DATABASE_URL + "?sslmode=disable", env.DATABASE_URL.replace("mirror_identity_staging", "customer_accounts")]) {
  test(`rejects runtime database override ${url.split(":")[0]}`, () => assert.throws(() => stagingDatabase(url, true)));
}
test("runtime rejects both migration and registered-operator credentials", () => {
  for (const key of ["IDENTITY_OPERATOR_DATABASE_URL", "MIGRATION_DATABASE_URL", "OPERATOR_DATABASE_URL"]) {
    assert.throws(() => assertRuntimeEnvironment({ ...env, [key]: "synthetic" }));
  }
});
for (const value of ["0", "9007199254740993", "9223372036854775807"]) {
  test(`preserves precise decimal epoch ${value}`, () => assert.equal(decimalEpoch(value), value));
}
for (const value of [0, 9007199254740992, 1n, "01", "-1", "1e3", "9223372036854775808", null]) {
  test(`rejects noncanonical epoch ${String(value)}`, () => assert.throws(() => decimalEpoch(value)));
}
const now = 1_800_000_000_000;
const p: Principal = { id: "principal", epoch: "9007199254740993", disabled: false, privileged: false };
const live = { id: "session", userId: "user", expiresAt: now + 3_600_000 };
const proof: EnrollmentProof = { principalId: p.id, userId: live.userId, email: "a@example.invalid",
  verifiedEmail: "a@example.invalid", emailVerified: true, mailboxAt: now - 120_000, issuer: "issuer", reconciler: "reconciler" };
const evidence: Evidence = { sessionId: live.id, userId: live.userId, principalId: p.id, epoch: p.epoch,
  passwordAt: now - 5000, mfaAt: now - 1000, factor: "password_totp", expiresAt: now + 3_000_000 };
const approval: OperatorApproval = { principalId: p.id, userId: live.userId, epoch: p.epoch, email: proof.email,
  approver: "independent-reviewer", approvedAt: now - 10_000, expiresAt: now + 3600_000 };
const uv: Evidence = { ...evidence, passwordAt: null, factor: "passkey_uv" };
const privileged = { ...p, privileged: true };
test("ordinary access needs mailbox possession and an actual supported factor", () => {
  assert.equal(assertStagingAuthorized(p, live, evidence, proof, null, now).epoch, "9007199254740993");
  assertStagingAuthorized(p, live, uv, proof, null, now);
  assert.throws(() => assertStagingAuthorized(p, live, { ...evidence, factor: null, mfaAt: null }, proof, null, now));
  assert.throws(() => assertStagingAuthorized(p, live, evidence, null, null, now));
});
for (const [name, delta] of Object.entries({ unverified: { emailVerified: false }, swappedEmail: { email: "b@example.invalid" },
  swappedUser: { userId: "another" }, swappedPrincipal: { principalId: "another" }, missingIssuer: { issuer: "" },
  missingReconciler: { reconciler: "" }, futureEvidence: { mailboxAt: now + 1 } })) {
  test(`mailbox evidence rejects ${name}`, () => assert.throws(() => assertStagingAuthorized(p, live, evidence, { ...proof, ...delta }, null, now)));
}
test("privileged email or TOTP alone cannot unlock access even after approval", () => {
  assert.throws(() => assertStagingAuthorized(privileged, live, uv, proof, null, now));
  assert.throws(() => assertStagingAuthorized(privileged, live, evidence, proof, approval, now));
  assert.throws(() => assertStagingAuthorized(privileged, live, null, proof, approval, now));
  assertStagingAuthorized(privileged, live, uv, proof, approval, now);
});
for (const [name, delta] of Object.entries({ self: { approver: p.id }, issuer: { approver: proof.issuer },
  reconciler: { approver: proof.reconciler }, otherPrincipal: { principalId: "other" }, otherUser: { userId: "other" },
  oldEpoch: { epoch: "9007199254740992" }, swappedEmail: { email: "other@example.invalid" },
  expired: { expiresAt: now }, future: { approvedAt: now + 1 }, invalidTime: { approvedAt: NaN } })) {
  test(`independent approval rejects ${name}`, () => assert.throws(() => assertStagingAuthorized(privileged, live, uv, proof, { ...approval, ...delta }, now)));
}
test("UV must occur after approval and be younger than five minutes", () => {
  for (const mfaAt of [approval.approvedAt, approval.approvedAt - 1, now - 300_000, now + 1]) {
    assert.throws(() => assertStagingAuthorized(privileged, live, { ...uv, mfaAt }, proof, approval, now));
  }
});
test("disabled principals and changed epochs invalidate otherwise complete enrollment", () => {
  assert.throws(() => assertStagingAuthorized({ ...privileged, disabled: true }, live, uv, proof, approval, now));
  assert.throws(() => assertStagingAuthorized({ ...p, epoch: "9007199254740994" }, live, evidence, proof, null, now));
});
test("encrypted outbox payloads are randomized, authenticated, and bound to delivery ID", () => {
  const key = env.IDENTITY_DELIVERY_KEY, token = opaqueToken(), sealed = sealDelivery(key, "one", token);
  assert.equal(openDelivery(key, "one", sealed), token); assert.ok(!sealed.includes(token));
  assert.notEqual(sealDelivery(key, "one", token), sealed);
  assert.throws(() => openDelivery(key, "two", sealed));
  assert.throws(() => openDelivery(randomBytes(32).toString("base64url"), "one", sealed));
  const data = Buffer.from(sealed, "base64url"); data[40] = data[40]! ^ 1;
  assert.throws(() => openDelivery(key, "one", data.toString("base64url")));
  assert.throws(() => openDelivery(key, "one", "short"));
});
test("fake transport exercises failures and stable idempotent acceptance without networking", async () => {
  const transport = new FakeEnrollmentTransport(), message = { idempotencyKey: "one", to: "a@example.invalid",
    url: "https://example.invalid/#synthetic", expiresAt: new Date(now) };
  transport.failures = 1; await assert.rejects(transport.send(message)); assert.equal(transport.messages.size, 0);
  await transport.send(message); await transport.send(message); assert.equal(transport.messages.size, 1);
});
test("fresh login strips secure and host-prefixed Identity cookies", () => {
  const clean = cleanAuthHeaders(new Headers({ cookie: "__Secure-mirror_identity.session_token=old; __Host-mirror_identity.password_flow=old; harmless=x" }), true);
  assert.equal(cookieValue(clean, "__Secure-mirror_identity.session_token"), null);
  assert.equal(cookieValue(clean, "__Host-mirror_identity.password_flow"), null); assert.equal(cookieValue(clean, "harmless"), "x");
});
test("HTTPS origin cannot silently run a plaintext listener", () => {
  assert.throws(() => createIdentityHttpServer(STAGING.origin, async () => new Response("no")));
  assert.throws(() => createIdentityHttpServer("http://localhost:3040", async () => new Response("no"), {}));
});
test("onboarding explains approval, replay, and registration rather than claiming access", () => {
  assert.match(enrollmentMessage("independent_operator_approval_required"), /waiting for independent/);
  assert.match(enrollmentMessage("invalid_invitation"), /expired, or already used/);
  assert.match(enrollmentMessage("fresh_passkey_after_approval_required"), /not authentication/);
});

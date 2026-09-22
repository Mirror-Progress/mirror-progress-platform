import test from "node:test";
import assert from "node:assert/strict";
import { assertAuthorized, assertOrdinaryPrincipal, verifiedFactor, validateAuthorizationQuery, safeResumePath, PolicyError } from "../../src/core/policy.js";
import type { Evidence, Principal } from "../../src/core/policy.js";
const now = 1_800_000_000_000;
const principal: Principal = { id: "mp-canonical", disabled: false, privileged: false, epoch: "7" };
const live = { id: "session-a", userId: "identity-a", expiresAt: now + 3_600_000 };
const valid: Evidence = { sessionId: live.id, userId: live.userId, principalId: principal.id, epoch: "7",
  passwordAt: now - 20_000, mfaAt: now - 10_000, factor: "password_totp", expiresAt: now + 3_590_000 };
test("password + verified TOTP authorizes the explicitly bound principal", () => {
  assert.equal(assertAuthorized(principal, live, valid, now).principalId, "mp-canonical");
});
test("UV-verified passkey does not need a password ceremony", () => {
  assertAuthorized(principal, live, { ...valid, passwordAt: null, factor: "passkey_uv" }, now);
});
for (const [name, delta] of Object.entries({
  "registration-only state": { factor: null, mfaAt: null },
  "missing password ceremony": { passwordAt: null },
  "password proven after TOTP": { passwordAt: now },
  "expired password flow": { passwordAt: now - 310_000 },
  "different principal": { principalId: "mp-other" },
  "different identity": { userId: "identity-other" },
  "different session": { sessionId: "session-other" },
  "old epoch": { epoch: "6" },
  "future factor time": { mfaAt: now + 1 },
  "stale factor": { mfaAt: now - 3_600_000 },
  "expired evidence": { expiresAt: now },
  "invalid factor timestamp": { mfaAt: Number.NaN },
  "invalid password timestamp": { passwordAt: Number.NaN },
  "infinite evidence lifetime": { expiresAt: Infinity },
})) {
  test(`rejects ${name}`, () => assert.throws(() => assertAuthorized(principal, live, { ...valid, ...delta } as Evidence, now), PolicyError));
}
test("registered-factor flag cannot substitute for evidence", () => {
  assert.throws(() => assertAuthorized(principal, live, null, now), PolicyError);
});
test("disabled principals remain disabled", () => assert.throws(() => assertAuthorized({ ...principal, disabled: true }, live, valid, now), PolicyError));
test("all privileged principals fail closed pending independent approval implementation", () => {
  assert.throws(() => assertOrdinaryPrincipal({ ...principal, privileged: true }), /independent_approval/);
});
test("expired library session is denied even with recent evidence", () => assert.throws(() => assertAuthorized(principal, { ...live, expiresAt: now }, valid, now), PolicyError));
test("step-up has an independent five-minute maximum", () => assert.throws(() => assertAuthorized(principal, live, { ...valid, mfaAt: now - 301_000, passwordAt: now - 302_000 }, now, 300_000), PolicyError));
test("verified passkey requires library-verified UV, not caller registration metadata", () => {
  assert.throws(() => verifiedFactor("passkey_authentication", { verified: true, userVerified: false }), PolicyError);
  assert.throws(() => verifiedFactor("passkey_authentication", { verified: false, userVerified: true }), PolicyError);
  assert.equal(verifiedFactor("passkey_authentication", { verified: true, userVerified: true }), "passkey_uv");
});
test("registration events are not accepted, even at an untyped boundary", () => {
  assert.throws(() => verifiedFactor("passkey_registration" as "passkey_authentication", { verified: true, userVerified: true }), PolicyError);
});
const client = { id: "mirror-local-synthetic", redirectUris: ["http://localhost:3000/api/auth/callback"] };
function query() { return new URLSearchParams({ client_id: client.id, redirect_uri: client.redirectUris[0]!, response_type: "code",
  scope: "openid profile email", state: "synthetic-state-123456", nonce: "synthetic-nonce-123456",
  code_challenge: "a".repeat(43), code_challenge_method: "S256" }); }
test("accepts exact callback plus code/S256/state/nonce", () => validateAuthorizationQuery(query(), client));
for (const [field, value] of [
  ["redirect_uri", "http://localhost:3000/api/auth/callback/"],
  ["redirect_uri", "http://localhost:3001/api/auth/callback"],
  ["redirect_uri", "http://localhost:3000/api/auth/callback?next=evil"],
  ["redirect_uri", "https://attacker.invalid/callback"],
  ["response_type", "token"], ["code_challenge_method", "plain"], ["scope", "openid admin"],
  ["scope", "openid offline_access"], ["nonce", ""], ["state", ""], ["client_id", "rogue"],
  ["code_challenge", "too-short"], ["request_uri", "https://attacker.invalid/par"],
] as const) test(`rejects ${field}=${value}`, () => { const q = query(); q.set(field, value); assert.throws(() => validateAuthorizationQuery(q, client), PolicyError); });
test("rejects duplicate authorization parameters", () => { const q=query();q.append("redirect_uri",client.redirectUris[0]!);assert.throws(() => validateAuthorizationQuery(q,client),PolicyError); });
test("resume targets cannot become open redirects", () => {
  for (const path of [null, "https://evil.invalid", "//evil.invalid", "/workspace", "/api/auth/oauth2/authorize/evil?x", "/api/auth/oauth2/authorize?x\n"]) assert.equal(safeResumePath(path), null);
  assert.equal(safeResumePath("/api/auth/oauth2/authorize?x=1"), "/api/auth/oauth2/authorize?x=1");
});

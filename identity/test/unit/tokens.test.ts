import test from "node:test";
import assert from "node:assert/strict";
import { opaqueToken, digest, tokenDigest, responseCookies, cookieValue, cleanAuthHeaders } from "../../src/core/tokens.js";
test("tokens have 256 bits of random input and only their SHA-256 digests are indexed", () => {
  const a=opaqueToken(),b=opaqueToken(); assert.equal(a.length,43);assert.notEqual(a,b);
  assert.equal(Buffer.from(a,"base64url").length,32);assert.equal(tokenDigest(a),digest(a));assert.equal(digest(a).length,64);
});
for (const token of [null, undefined, "", "a".repeat(42), "a".repeat(44), "!".repeat(43), 123]) {
  test(`rejects malformed invitation ${String(token).slice(0,10)}`, () => assert.throws(() => tokenDigest(token)));
}
test("duplicate cookies are rejected instead of selecting an attacker-controlled value", () => {
  assert.equal(cookieValue(new Headers({cookie:"flow=one; flow=two"}),"flow"),null);
});
test("cookie reconstruction handles individual Set-Cookie headers without treating attributes as cookies", () => {
  const outgoing=new Headers();outgoing.append("set-cookie","session=new; HttpOnly; Path=/; SameSite=Lax");outgoing.append("set-cookie","challenge=next; Max-Age=300");
  const merged=responseCookies(new Headers({cookie:"session=old; unrelated=x"}),outgoing);
  assert.equal(cookieValue(merged,"session"),"new");assert.equal(cookieValue(merged,"challenge"),"next");
  assert.equal(cookieValue(merged,"unrelated"),"x");assert.equal(cookieValue(merged,"Path"),null);
});
test("trusted-device bypass and untrusted proxy headers are stripped", () => {
  const clean=cleanAuthHeaders(new Headers({cookie:"mirror_identity.trust_device=bad; mirror_identity.session_token=session",
    authorization:"Bearer not-a-session", "x-forwarded-for":"attacker", "x-forwarded-host":"evil.invalid", "x-mirror-transport-ip":"198.18.1.2"}));
  assert.equal(clean.get("authorization"),null);assert.equal(clean.get("x-forwarded-for"),null);
  assert.equal(clean.get("x-mirror-transport-ip"),null);
  assert.equal(cookieValue(clean,"mirror_identity.trust_device"),null);assert.equal(cookieValue(clean,"mirror_identity.session_token"),"session");
});
test("fresh password logins cannot reuse old identity cookies", () => {
  const clean=cleanAuthHeaders(new Headers({cookie:"mirror_identity.session_token=old; mirror_identity.two_factor=old; harmless=x"}),true);
  assert.equal(cookieValue(clean,"mirror_identity.session_token"),null);assert.equal(cookieValue(clean,"mirror_identity.two_factor"),null);assert.equal(cookieValue(clean,"harmless"),"x");
});

import { verifiedTotpDigest } from "../../src/core/tokens.js";
test("verified TOTP replay keys are keyed, stable, and separated by user", () => {
  const key="a".repeat(64);
  const value=verifiedTotpDigest(key,"subject-a","123456");
  assert.match(value,/^[a-f0-9]{64}$/);
  assert.equal(value,verifiedTotpDigest(key,"subject-a","123456"));
  assert.notEqual(value,verifiedTotpDigest("b".repeat(64),"subject-a","123456"));
  assert.notEqual(value,verifiedTotpDigest(key,"subject-b","123456"));
  assert.notEqual(value,verifiedTotpDigest(key,"subject-a","654321"));
});
test("unverified-shaped TOTP bookkeeping input is rejected", () => {
  for (const code of ["12345","1234567","abcdef", "123 56"]) assert.throws(() => verifiedTotpDigest("a".repeat(64),"user",code));
  assert.throws(() => verifiedTotpDigest("short","user","123456"));
});

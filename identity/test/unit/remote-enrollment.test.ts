import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { REMOTE_GRANT_MS, remoteGrantKey, remoteIssueKey, signRemoteGrant, verifyRemoteGrant } from "../../src/core/remote-enrollment.js";

test("remote enrollment link and grant are bound to one account and session", () => {
  const secret = randomBytes(48).toString("hex");
  const token = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const now = Date.now();
  const cookie = signRemoteGrant(secret, "owner", "phone-session", nonce, now + REMOTE_GRANT_MS);
  assert.match(remoteIssueKey("owner", token) ?? "", /^[a-f0-9]{64}$/);
  assert.notEqual(remoteIssueKey("owner", token), remoteIssueKey("other", token));
  assert.match(remoteGrantKey(nonce) ?? "", /^[a-f0-9]{64}$/);
  assert.equal(verifyRemoteGrant(secret, cookie, "owner", "phone-session", now), nonce);
  assert.equal(verifyRemoteGrant(secret, cookie, "other", "phone-session", now), null);
  assert.equal(verifyRemoteGrant(secret, cookie, "owner", "other-session", now), null);
  assert.equal(verifyRemoteGrant(secret, cookie, "owner", "phone-session", now + REMOTE_GRANT_MS), null);
  assert.equal(verifyRemoteGrant(randomBytes(48).toString("hex"), cookie, "owner", "phone-session", now), null);
  assert.equal(verifyRemoteGrant(secret, cookie.slice(0, -1) + "x", "owner", "phone-session", now), null);
});

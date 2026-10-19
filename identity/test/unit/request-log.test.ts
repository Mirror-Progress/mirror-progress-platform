import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MIN_PASSWORD_LENGTH, PolicyError } from "../../src/core/policy.js";
import { loggableRoute, loggedRoute, refusalLog } from "../../src/core/request-log.js";

test("refusal log keeps the reason code and hides tokens and ids", () => {
  assert.deepEqual(refusalLog("POST", "/api/identity/enroll", 400, new PolicyError("invalid_invitation", 400)),
    { event: "identity_request_refused", method: "POST", route: "/api/identity/enroll", status: 400, code: "invalid_invitation" });
  assert.equal(loggableRoute("/api/auth/reset-password/Abc_def-ghijklmnopqrstuvwxyz0123456789ABCDE"), "/api/auth/reset-password/:id");
  assert.equal(loggableRoute("/api/identity/admin/managed/6f147ba3-86a8-43e7-96e1-a54309d5d08e/revoke"),
    "/api/identity/admin/managed/:id/revoke");
  assert.equal(loggedRoute("/health"), false);
  assert.equal(loggedRoute("/style.css"), false);
  assert.equal(loggedRoute("/internal/identity/session-status"), true);
});

test("a 500 logs only database error and constraint codes, never the message", () => {
  const error = Object.assign(new Error("duplicate key value (email)=(person@example.com)"),
    { code: "23505", constraint: "user_email_key", detail: "Key (email)=(person@example.com)" });
  const entry = refusalLog("POST", "/api/identity/enroll", 500, error);
  assert.deepEqual(entry, { event: "identity_request_refused", method: "POST", route: "/api/identity/enroll", status: 500,
    code: "request_failed", dbCode: "23505", constraint: "user_email_key" });
  assert.doesNotMatch(JSON.stringify(entry), /example\.com/);
});

test("passwords need 8 characters everywhere, and invite tokens are not password fields", () => {
  assert.equal(MIN_PASSWORD_LENGTH, 8);
  const page = readFileSync(new URL("../../../public/production.html", import.meta.url), "utf8");
  assert.doesNotMatch(page, /minlength="14"|14 characters/);
  // Password managers autofill type="password" fields, and the form clears them after a failed attempt.
  assert.doesNotMatch(page, /name="(invitation|mailboxToken)" type="password"/);
});

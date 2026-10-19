import test from "node:test";
import assert from "node:assert/strict";
import { invitationResendable, invitationStatus } from "../../src/core/invitation-status.js";
import { notifyPlatformPrincipalRevoked, PRINCIPAL_REVOKED_PATH } from "../../src/core/platform-revoke.js";

const id = "00000000-0000-4000-8000-000000000001";
const future = new Date(Date.now() + 86_400_000).toISOString(), past = new Date(Date.now() - 1000).toISOString();

test("invitation status: Revoked outranks Accepted, Accepted outranks pending states", () => {
  assert.equal(invitationStatus({ accepted: true, revokedAt: past, expiresAt: future, deliveryStatus: "sent" }), "Revoked");
  assert.equal(invitationStatus({ accepted: false, revokedAt: past, expiresAt: past, deliveryStatus: "cancelled" }), "Revoked");
  assert.equal(invitationStatus({ accepted: true, revokedAt: null, expiresAt: past, deliveryStatus: "sent" }), "Accepted");
  assert.equal(invitationStatus({ accepted: false, revokedAt: null, expiresAt: past, deliveryStatus: "sent" }), "Expired");
  assert.equal(invitationStatus({ accepted: false, revokedAt: null, expiresAt: future, deliveryStatus: "sent" }), "Sent");
  assert.equal(invitationStatus({ accepted: false, revokedAt: null, expiresAt: future, deliveryStatus: "failed" }), "Delivery failed");
  assert.equal(invitationStatus({ accepted: false, revokedAt: null, expiresAt: future, deliveryStatus: "queued" }), "Sending");
  assert.equal(invitationStatus({ source: "legacy_pilot", accepted: false }), "Pending · previous system");
});

test("revoked and accepted rows offer no Resend; pending managed invitations do", () => {
  assert.equal(invitationResendable({ principalId: id, accepted: true, revokedAt: past }), false);
  assert.equal(invitationResendable({ principalId: id, accepted: false, revokedAt: past }), false);
  assert.equal(invitationResendable({ principalId: id, accepted: true, revokedAt: null }), false);
  assert.equal(invitationResendable({ principalId: id, accepted: false, revokedAt: null }), true);
  assert.equal(invitationResendable({ principalId: "studioiq_pilot_x", accepted: false, revokedAt: null }), false);
});

const secret = "r".repeat(64);
const config = { platformOrigin: "http://127.0.0.1:3031", sessionStatusSecret: secret };
async function capture<T>(run: () => Promise<T>): Promise<{ result: T; lines: string[] }> {
  const lines: string[] = [], info = console.info, error = console.error;
  console.info = (line: string) => { lines.push(line); }; console.error = (line: string) => { lines.push(line); };
  try { return { result: await run(), lines }; } finally { console.info = info; console.error = error; }
}

test("platform revoke notice: exact URL, bearer secret, JSON body and outbound options", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fake = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    return new Response(null, { status: 202 });
  }) as typeof fetch;
  const { result, lines } = await capture(() => notifyPlatformPrincipalRevoked(config, id, fake));
  assert.equal(result, 202);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, `http://127.0.0.1:3031${PRINCIPAL_REVOKED_PATH}`);
  assert.equal(PRINCIPAL_REVOKED_PATH, "/api/internal/identity/principal-revoked");
  const init = calls[0]!.init, headers = new Headers(init.headers);
  assert.equal(init.method, "POST"); assert.equal(init.redirect, "error"); assert.equal(init.cache, "no-store");
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(headers.get("authorization"), `Bearer ${secret}`);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(init.body, JSON.stringify({ principalId: id, reason: "identity_revoked" }));
  assert.deepEqual(JSON.parse(init.body as string), { principalId: id, reason: "identity_revoked" });
  assert.deepEqual(lines.map(line => JSON.parse(line)), [{ event: "identity_platform_revoke_notify", status: 202 }]);
});

test("platform revoke notice: 200/404 are done; errors, 5xx and missing secret only log, never throw", async () => {
  for (const status of [200, 404, 500]) {
    const { result, lines } = await capture(() => notifyPlatformPrincipalRevoked(config, id,
      (async () => new Response("{}", { status })) as typeof fetch));
    assert.equal(result, status);
    assert.deepEqual(JSON.parse(lines[0]!), { event: "identity_platform_revoke_notify", status });
  }
  const failing = (async () => { throw new TypeError("network down"); }) as typeof fetch;
  const failed = await capture(() => notifyPlatformPrincipalRevoked(config, id, failing));
  assert.equal(failed.result, "failed");
  assert.deepEqual(JSON.parse(failed.lines[0]!), { event: "identity_platform_revoke_notify", status: "failed" });
  let called = false;
  const unconfigured = await capture(() => notifyPlatformPrincipalRevoked({ platformOrigin: config.platformOrigin }, id,
    (async () => { called = true; return new Response(null); }) as typeof fetch));
  assert.equal(unconfigured.result, "unconfigured"); assert.equal(called, false);
  // No principal id, email, secret or URL in the log line.
  for (const line of [...failed.lines, ...unconfigured.lines]) {
    assert.ok(!line.includes(id) && !line.includes(secret) && !line.includes("127.0.0.1"));
  }
});

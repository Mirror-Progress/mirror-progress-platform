/**
 * Route-level parity for behavior the live production build already serves: legacy Prospect pilot
 * listing and migration, and trial-manager resend (migration 007). The store and session are stubbed;
 * no database, mailbox or network is used (fetch to the platform is replaced in-process).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import type { Config } from "../../src/core/config.js";
import type { Principal } from "../../src/core/policy.js";
import { PRODUCTION } from "../../src/core/production-config.js";
import { StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";

const statusSecret = "q".repeat(64);
const config: Config = { mode: "production", freshInstall: true, origin: PRODUCTION.origin,
  databaseUrl: "postgresql://mirror_identity_production_runtime:synthetic@localhost/mirror_identity_production",
  secret: "a".repeat(64), sessionStatusSecret: statusSecret, bindHost: "127.0.0.1", port: 3040,
  oidcClientId: PRODUCTION.clientId, redirectUris: [PRODUCTION.redirect],
  staging: { rpId: PRODUCTION.rpId, deliveryKey: Buffer.alloc(32, 7).toString("base64url"), certFile: "/x", keyFile: "/y" } };

const EXTERNAL = "11111111-1111-4111-8111-111111111111", ADMIN_INVITE = "22222222-2222-4222-8222-222222222222";
const SELF_SERVE = "33333333-3333-4333-8333-333333333333";
const PILOT = "studioiq_pilot_44444444-4444-4444-8444-444444444444";
const managedRows = [
  { principalId: EXTERNAL, email: "ada@studio.example", company: "Studio", accountType: "external", role: "client", inviter: "owner" },
  { principalId: ADMIN_INVITE, email: "lead@mirrorprogress.com", company: "Mirror Progress", accountType: "admin", role: "project_lead", inviter: "owner" },
  { principalId: SELF_SERVE, email: "sam@self.example", company: "Self Co", accountType: "external", role: "client", inviter: "mirror-self-serve-trial" },
];
const pilots = [
  { id: PILOT, name: "Grace Hopper", email: "grace@legacy.example", company: "Legacy Co", trialDays: 14, seatAllowance: 3, createdAt: "2026-09-01T00:00:00Z" },
  // Same email+company as a managed invitation: must not be listed twice.
  { id: "studioiq_pilot_55555555-5555-4555-8555-555555555555", name: "Ada", email: "ADA@studio.example", company: "studio", trialDays: 14, seatAllowance: 1, createdAt: "2026-09-01T00:00:00Z" },
];

class StubStore extends StagingStore {
  admin = false; trialManager = true;
  calls: Array<[string, unknown]> = [];
  override assertCredentialPrincipal(_p: Principal): void {}
  override async principal(): Promise<Principal> { return { id: "actor", disabled: false, privileged: true, epoch: "0" }; }
  override async authorize() {
    return { principal: { id: "actor", disabled: false, privileged: true, epoch: "0" },
      evidence: { sessionId: "s", userId: "u", principalId: "actor", epoch: "0", passwordAt: null, mfaAt: Date.now(),
        factor: "passkey_uv" as const, expiresAt: Date.now() + 60_000 } };
  }
  override async canManageInvitations() { return this.admin; }
  override async canManageTrials() { return this.trialManager; }
  override async rateLimit(): Promise<void> {}
  override async managedInvitations(inviter?: string) { this.calls.push(["list", inviter]); return managedRows.map(r => ({ ...r })); }
  override async resendManagedInvitation(_s: string, id: string) { this.calls.push(["resend", id]); return { status: "queued" as const }; }
  override async revokeManagedInvitation(_s: string, id: string) { this.calls.push(["revoke", id]); return { status: "revoked" as const }; }
  override async issueManagedInvitation(_s: string, input: Parameters<StagingStore["issueManagedInvitation"]>[1]) {
    this.calls.push(["issue", input]); return { status: "queued" as const, principalId: "66666666-6666-4666-8666-666666666666" };
  }
}

async function harness(fn: (h: { app: ReturnType<typeof createApp>; store: StubStore; platform: string[] }) => Promise<void>,
  options: { legacyDown?: boolean } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "legacy-trial-unit-"));
  const env = { ...process.env };
  const realFetch = globalThis.fetch;
  Object.assign(process.env, { IDENTITY_LOCAL_PREVIEW: "1", IDENTITY_MAIL_DELIVERY: "local-file",
    IDENTITY_LOCAL_PREVIEW_OUTBOX: join(directory, "outbox.jsonl") });
  delete process.env.IDENTITY_MODE; delete process.env.NODE_ENV;
  const platform: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    platform.push(`${init?.method ?? "GET"} ${url} ${new Headers(init?.headers).get("authorization") === `Bearer ${statusSecret}`}`);
    if (url.endsWith("/api/internal/identity/legacy-pilots")) {
      return options.legacyDown ? new Response("unavailable", { status: 503 }) : Response.json({ pilots });
    }
    if (url.endsWith("/api/internal/identity/prepare-trial")) return Response.json({ ok: true });
    return new Response("unexpected", { status: 500 });
  }) as typeof fetch;
  const pool = new Pool({ connectionString: config.databaseUrl });
  const store = new StubStore(pool, config);
  const auth = createAuth(config, store);
  (auth.api as { getSession: unknown }).getSession = async () => ({ session: { id: "s", userId: "u" }, user: { id: "u" } });
  try { await fn({ app: createApp(config, store, auth), store, platform }); }
  finally {
    globalThis.fetch = realFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    rmSync(directory, { recursive: true, force: true });
    await pool.end();
  }
}
const call = (app: ReturnType<typeof createApp>, path: string, body?: unknown) =>
  app(new Request(PRODUCTION.origin + path, { method: body === undefined ? "GET" : "POST",
    headers: { origin: PRODUCTION.origin, "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));

test("trial managers list every external invitation plus pending legacy pilots, de-duplicated", async () => {
  await harness(async ({ app, store, platform }) => {
    const response = await call(app, "/api/identity/admin/trial-invitations");
    assert.equal(response.status, 200);
    const result = await response.json() as { invitations: Array<Record<string, unknown>>; trialOnly: boolean; legacyUnavailable: boolean };
    assert.equal(result.trialOnly, true);
    assert.equal(result.legacyUnavailable, false);
    // Not filtered to the caller's own invitations (live behavior): all inviters, external only.
    assert.deepEqual(store.calls[0], ["list", undefined]);
    assert.deepEqual(result.invitations.map(i => i.principalId), [EXTERNAL, SELF_SERVE, PILOT]);
    const legacy = result.invitations[2]!;
    assert.equal(legacy.source, "legacy_pilot"); assert.equal(legacy.accountType, "external"); assert.equal(legacy.role, "client");
    assert.deepEqual(platform, [`GET https://platform.mirrorprogress.com/api/internal/identity/legacy-pilots true`]);
  });
});

test("an unavailable legacy list is flagged, not fatal; admins see all invitations with legacy pilots", async () => {
  await harness(async ({ app }) => {
    const result = await (await call(app, "/api/identity/admin/trial-invitations")).json() as Record<string, unknown>;
    assert.equal(result.legacyUnavailable, true);
    assert.equal((result.invitations as unknown[]).length, 2);
  }, { legacyDown: true });
  await harness(async ({ app, store }) => {
    store.admin = true;
    const result = await (await call(app, "/api/identity/admin/invitations")).json() as { invitations: Array<Record<string, unknown>> };
    assert.deepEqual(result.invitations.map(i => i.principalId), [EXTERNAL, ADMIN_INVITE, SELF_SERVE, PILOT]);
  });
});

test("trial managers may resend pending external invitations only; revocation stays admin-only", async () => {
  await harness(async ({ app, store }) => {
    for (const id of [EXTERNAL, SELF_SERVE]) {
      const response = await call(app, `/api/identity/admin/invitations/${id}/resend`, {});
      assert.equal(response.status, 200);
    }
    assert.equal((await call(app, `/api/identity/admin/invitations/${ADMIN_INVITE}/resend`, {})).status, 404);
    assert.equal((await call(app, `/api/identity/admin/invitations/${EXTERNAL}/revoke`, {})).status, 404);
    assert.deepEqual(store.calls.filter(c => c[0] !== "list"), [["resend", EXTERNAL], ["resend", SELF_SERVE]]);
    store.trialManager = false;
    assert.equal((await call(app, `/api/identity/admin/invitations/${EXTERNAL}/resend`, {})).status, 404);
    store.admin = true;
    assert.equal((await call(app, `/api/identity/admin/invitations/${ADMIN_INVITE}/revoke`, {})).status, 200);
    assert.equal((await call(app, `/api/identity/admin/invitations/${ADMIN_INVITE}/resend`, {})).status, 200);
  });
});

test("legacy pilots migrate into an external/client Mirror Identity invitation", async () => {
  await harness(async ({ app, store }) => {
    const path = `/api/identity/admin/legacy-pilots/${PILOT}/migrate`;
    assert.equal((await call(app, path, { role: "admin" })).status, 400);
    const response = await call(app, path, {});
    assert.equal(response.status, 202);
    assert.deepEqual(store.calls.find(c => c[0] === "issue"), ["issue",
      { name: "Grace Hopper", email: "grace@legacy.example", company: "Legacy Co", accountType: "external", role: "client" }]);
    // A pilot that already has a managed invitation conflicts; an unknown pilot is unavailable.
    const duplicate = await call(app, "/api/identity/admin/legacy-pilots/studioiq_pilot_55555555-5555-4555-8555-555555555555/migrate", {});
    assert.equal(duplicate.status, 409); assert.deepEqual(await duplicate.json(), { error: "invitation_conflict" });
    const unknown = await call(app, "/api/identity/admin/legacy-pilots/studioiq_pilot_77777777-7777-4777-8777-777777777777/migrate", {});
    assert.equal(unknown.status, 409); assert.deepEqual(await unknown.json(), { error: "legacy_pilot_unavailable" });
    assert.equal((await call(app, "/api/identity/admin/legacy-pilots/not-a-pilot/migrate", {})).status, 404);
    store.trialManager = false;
    assert.equal((await call(app, path, {})).status, 404);
  });
});

test("a new trial is refused for an email with a pending legacy pilot, before Prospect is asked to prepare it", async () => {
  await harness(async ({ app, store, platform }) => {
    const response = await call(app, "/api/identity/admin/trial-invitations",
      { name: "Grace", email: "Grace@Legacy.example", company: "Other Co", trialDays: 14, seatAllowance: 2 });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "legacy_pilot_exists" });
    assert.ok(!platform.some(p => p.includes("prepare-trial")));
    assert.ok(!store.calls.some(c => c[0] === "issue"));
  });
  await harness(async ({ app }) => {
    const response = await call(app, "/api/identity/admin/trial-invitations",
      { name: "Grace", email: "new@fresh.example", company: "Other Co", trialDays: 14, seatAllowance: 2 });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "trial_preparation_failed" });
  }, { legacyDown: true });
});

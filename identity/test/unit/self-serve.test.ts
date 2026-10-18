import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import { loadConfig, platformOrigin } from "../../src/core/config.js";
import type { Config } from "../../src/core/config.js";
import { PRODUCTION } from "../../src/core/production-config.js";
import { StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import { enrollmentTransport, invitationRecipientDeliverable } from "../../src/core/mail-delivery.js";
import { LocalFileEnrollmentTransport, localPreviewConfig, localPreviewEnabled, localPreviewTransport } from "../../src/core/local-preview.js";

const secret = "s".repeat(64);
const config: Config = { mode: "production", freshInstall: true, origin: PRODUCTION.origin,
  databaseUrl: "postgresql://mirror_identity_production_runtime:synthetic@localhost/mirror_identity_production",
  secret: "a".repeat(64), sessionStatusSecret: secret, bindHost: "127.0.0.1", port: 3040,
  oidcClientId: PRODUCTION.clientId, redirectUris: [PRODUCTION.redirect],
  staging: { rpId: PRODUCTION.rpId, deliveryKey: Buffer.alloc(32, 7).toString("base64url"), certFile: "/x", keyFile: "/y" } };

class RecordingStore extends StagingStore {
  calls: Array<{ name: string; email: string; company: string }> = [];
  override async rateLimit(): Promise<void> {}
  override async issueSelfServeInvitation(input: { name: string; email: string; company: string }) {
    this.calls.push(input);
    return { status: "queued" as const, principalId: "00000000-0000-4000-8000-000000000000" };
  }
}
function harness(overrides: Partial<Config> = {}) {
  const merged = { ...config, ...overrides };
  // The pool is never connected: the stubbed store answers every query this route makes.
  const pool = new Pool({ connectionString: merged.databaseUrl });
  const store = new RecordingStore(pool, merged);
  return { store, pool, app: createApp(merged, store, createAuth(merged, store)) };
}
const path = "/internal/identity/self-serve-trial-invitations";
const body = { name: "Ada Lovelace", email: "Ada@Example-Studio.com ", company: "Example Studio" };
function request(init: { auth?: string; origin?: string; method?: string; payload?: unknown } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (init.auth !== "") headers.set("authorization", init.auth ?? `Bearer ${secret}`);
  if (init.origin) headers.set("origin", init.origin);
  return new Request(PRODUCTION.origin + path, { method: init.method ?? "POST", headers,
    ...(init.method === "GET" ? {} : { body: JSON.stringify(init.payload ?? body) }) });
}
function withLocalCapture<T>(fn: () => Promise<T>) {
  const directory = mkdtempSync(join(tmpdir(), "self-serve-unit-"));
  const before = { ...process.env };
  Object.assign(process.env, { IDENTITY_LOCAL_PREVIEW: "1", IDENTITY_MAIL_DELIVERY: "local-file",
    IDENTITY_LOCAL_PREVIEW_OUTBOX: join(directory, "outbox.jsonl") });
  delete process.env.IDENTITY_MODE; delete process.env.NODE_ENV;
  return fn().finally(() => {
    for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key];
    Object.assign(process.env, before);
    rmSync(directory, { recursive: true, force: true });
  });
}

test("self-serve invitation endpoint requires the service secret in constant time and no browser origin", async () => {
  await withLocalCapture(async () => {
    const { app, store, pool } = harness();
    for (const init of [{ auth: "" }, { auth: `Bearer ${"t".repeat(64)}` }, { auth: secret }, { origin: PRODUCTION.origin }]) {
      const response = await app(request(init));
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "service_authentication_required" });
    }
    assert.equal((await app(request({ method: "GET" }))).status, 404);
    assert.equal(store.calls.length, 0);
    await pool.end();
  });
});

test("self-serve invitations are external/client only: caller cannot choose role, type or extra fields", async () => {
  await withLocalCapture(async () => {
    const { app, store, pool } = harness();
    for (const payload of [{ ...body, accountType: "admin" }, { ...body, role: "admin" }, { name: body.name, email: body.email },
      { ...body, email: "not-an-email" }, { ...body, email: "staff@mirrorprogress.com" }, { ...body, company: "Mirror Progress" },
      { ...body, name: "x".repeat(121) }, { ...body, company: "Evil\u0000Co" }]) {
      const response = await app(request({ payload }));
      assert.equal(response.status, 400, JSON.stringify(payload));
    }
    assert.equal(store.calls.length, 0);
    const accepted = await app(request());
    assert.equal(accepted.status, 202);
    assert.deepEqual(await accepted.json(), { status: "queued", principalId: "00000000-0000-4000-8000-000000000000" });
    assert.deepEqual(store.calls, [{ name: "Ada Lovelace", email: "ada@example-studio.com", company: "Example Studio" }]);
    await pool.end();
  });
});

test("self-serve endpoint is not exposed outside the production fresh-install profile or without delivery", async () => {
  const fresh = harness({ freshInstall: false });
  assert.equal((await fresh.app(request())).status, 404);
  const noSecret = harness({ sessionStatusSecret: undefined });
  assert.equal((await noSecret.app(request())).status, 404);
  // No verified mail transport configured: refuse before creating anything.
  const unconfigured = harness();
  const before = process.env.IDENTITY_MAIL_DELIVERY; delete process.env.IDENTITY_MAIL_DELIVERY;
  try { assert.equal((await unconfigured.app(request())).status, 409); }
  finally { if (before !== undefined) process.env.IDENTITY_MAIL_DELIVERY = before; }
  assert.equal(unconfigured.store.calls.length, 0);
  await Promise.all([fresh.pool.end(), noSecret.pool.end(), unconfigured.pool.end()]);
});

test("hosted profiles derive the platform origin from their pinned redirect and refuse overrides", () => {
  const env = { IDENTITY_MODE: "production", IDENTITY_ORIGIN: PRODUCTION.origin, IDENTITY_RP_ID: PRODUCTION.rpId,
    IDENTITY_OIDC_CLIENT_ID: PRODUCTION.clientId, IDENTITY_REDIRECT_URIS: JSON.stringify([PRODUCTION.redirect]),
    DATABASE_URL: "postgresql://mirror_identity_production_runtime:synthetic@localhost/mirror_identity_production",
    BETTER_AUTH_SECRET: "a".repeat(64), IDENTITY_SESSION_STATUS_SECRET: "b".repeat(64),
    IDENTITY_DELIVERY_KEY: Buffer.alloc(32, 3).toString("base64url"),
    IDENTITY_TLS_CERT_FILE: "/synthetic/cert.pem", IDENTITY_TLS_KEY_FILE: "/synthetic/key.pem" };
  assert.equal(platformOrigin(loadConfig(env)), "https://platform.mirrorprogress.com");
  assert.equal(platformOrigin(loadConfig({ ...env, IDENTITY_PLATFORM_ORIGIN: "https://platform.mirrorprogress.com" })), "https://platform.mirrorprogress.com");
  assert.throws(() => loadConfig({ ...env, IDENTITY_PLATFORM_ORIGIN: "http://127.0.0.1:3031" }));
  assert.equal(platformOrigin({}), "https://platform.mirrorprogress.com");
});

test("local preview mode and mail capture are impossible under NODE_ENV=production or a hosted IDENTITY_MODE", () => {
  const base = { IDENTITY_LOCAL_PREVIEW: "1", IDENTITY_MAIL_DELIVERY: "local-file", IDENTITY_LOCAL_PREVIEW_OUTBOX: "/tmp/outbox.jsonl" };
  assert.equal(localPreviewEnabled(base), true);
  for (const delta of [{ NODE_ENV: "production" }, { IDENTITY_MODE: "production" }, { IDENTITY_MODE: "synthetic" }, { IDENTITY_LOCAL_PREVIEW: "true" }]) {
    assert.equal(localPreviewEnabled({ ...base, ...delta }), false, JSON.stringify(delta));
    assert.equal(localPreviewTransport({ ...base, ...delta }), undefined);
    assert.throws(() => localPreviewConfig({ ...base, ...delta }), /local_preview_disabled/);
  }
  const before = { ...process.env };
  try {
    Object.assign(process.env, base, { NODE_ENV: "production" });
    assert.equal(enrollmentTransport(), undefined, "server.ts then refuses to start with this delivery setting");
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key];
    Object.assign(process.env, before);
  }
});

test("local preview configuration accepts only loopback databases and platform origins", () => {
  const good = { IDENTITY_LOCAL_PREVIEW: "1", BETTER_AUTH_SECRET: "a".repeat(64), IDENTITY_SESSION_STATUS_SECRET: "b".repeat(64),
    IDENTITY_DELIVERY_KEY: Buffer.alloc(32, 9).toString("base64url"), IDENTITY_PLATFORM_ORIGIN: "http://127.0.0.1:3031",
    DATABASE_URL: "postgresql://mirror_identity_local_preview_runtime:pw@127.0.0.1:55440/mirror_identity_local_preview" };
  const config = localPreviewConfig(good);
  assert.equal(config.origin, "http://localhost:3040");
  assert.deepEqual(config.redirectUris, ["http://127.0.0.1:3031/api/auth/callback"]);
  for (const delta of [
    { DATABASE_URL: good.DATABASE_URL.replace("127.0.0.1", "db.abc.us-east-1.rds.amazonaws.com") },
    { DATABASE_URL: good.DATABASE_URL.replace("/mirror_identity_local_preview", "/mirror_identity_production") },
    { DATABASE_URL: good.DATABASE_URL.replace("_runtime", "_owner") },
    { IDENTITY_PLATFORM_ORIGIN: "https://platform.mirrorprogress.com" }, { IDENTITY_PLATFORM_ORIGIN: undefined },
    { IDENTITY_SESSION_STATUS_SECRET: undefined }, { IDENTITY_DELIVERY_KEY: "short" },
  ]) assert.throws(() => localPreviewConfig({ ...good, ...delta }), JSON.stringify(delta));
});

test("local mail capture writes a mode-0600 file and refuses non-loopback links", async () => {
  await withLocalCapture(async () => {
    const outbox = process.env.IDENTITY_LOCAL_PREVIEW_OUTBOX!;
    const transport = new LocalFileEnrollmentTransport(outbox);
    await assert.rejects(transport.send({ idempotencyKey: "a", to: "a@example.com", expiresAt: new Date(Date.now() + 60_000),
      url: "https://accounts.mirrorprogress.com/#invitation=" + "x".repeat(43) }), /local_preview_link_not_loopback/);
    await transport.send({ idempotencyKey: "b", to: "a@example.com", expiresAt: new Date(Date.now() + 60_000),
      url: "http://localhost:3040/#invitation=" + "y".repeat(43), inviteeName: "Ada", company: "Example Studio" });
    await transport.send({ idempotencyKey: "c", to: "c@example.com", expiresAt: new Date(Date.now() + 60_000),
      url: "http://localhost:3040/#invitation=" + "z".repeat(43), inviteeName: "Cy Doe", company: "Trial Studio",
      invitationKind: "self_serve_trial" });
    const lines = readFileSync(outbox, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(lines.length, 2); assert.equal(lines[0].to, "a@example.com");
    // The captured message is the branded email a real transport sends, with the trial copy when selected.
    assert.equal(lines[0].subject, "You're invited to Mirror Progress Prospect"); assert.equal(lines[0].invitationKind, "standard");
    assert.equal(lines[1].subject, "Start your 14-day Prospect trial"); assert.equal(lines[1].invitationKind, "self_serve_trial");
    assert.match(lines[1].html, /Start your trial/);
    assert.equal(statSync(outbox).mode & 0o777, 0o600);
    assert.equal(await invitationRecipientDeliverable("a@example.com"), true);
    assert.throws(() => new LocalFileEnrollmentTransport("relative.jsonl"));
  });
});

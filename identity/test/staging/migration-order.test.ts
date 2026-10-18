/**
 * Local PostgreSQL only (SELF_SERVE_TEST_OWNER_URL, loopback). Creates its own throwaway database
 * mirror_identity_migration_order_test and simulates production: 001-007 are applied and checksummed
 * first, exactly as the live build's runner did, with invitations already issued. The release runner
 * path (001-008) must then skip 001-007, apply only 008, be idempotent on a second run, refuse a changed
 * checksum, and leave 007's trial-manager resend behavior intact. Fake data only; no mailbox or network.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import type { Config } from "../../src/core/config.js";
import { digest, opaqueToken } from "../../src/core/tokens.js";
import { StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { applyLocalPreviewSchema, LOCAL_PREVIEW_MIGRATIONS } from "../../scripts/local-preview-schema.js";

const enabled = Boolean(process.env.SELF_SERVE_TEST_OWNER_URL);
const DATABASE = "mirror_identity_migration_order_test", RUNTIME = "mirror_identity_migration_order_test_runtime";
const OPERATOR = "mirror_identity_migration_order_test_operator";
const PRODUCTION_APPLIED = LOCAL_PREVIEW_MIGRATIONS.slice(0, 7);
const runtimePassword = randomBytes(32).toString("hex");
let owner: Pool, runtime: Pool, config: Config;
const actors = { admin: "", manager: "" } as Record<"admin" | "manager", string>;
const sessions = { admin: "", manager: "" } as Record<"admin" | "manager", string>;
const invited = { external: "", internal: "", bySelfServe: "" };

/** The production runner's loop (scripts/migrate-production.ts), restricted to the migrations given. */
async function runMigrations(names: readonly string[]) {
  const client = await owner.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TABLE IF NOT EXISTS mirror_schema_migration
      (name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const name of names) {
      const sql = await readFile(`migrations/${name}.sql`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const prior = await client.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
      if (prior.rows[0] && prior.rows[0].checksum !== checksum) throw new Error("Applied checksum mismatch");
      if (!prior.rows[0]) {
        await client.query(sql);
        await client.query("INSERT INTO mirror_schema_migration(name,checksum) VALUES ($1,$2)", [name, checksum]);
      }
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
const history = async () => (await owner.query<{ name: string; checksum: string; applied_at: Date }>(
  "SELECT name,checksum,applied_at FROM mirror_schema_migration ORDER BY name")).rows;
const resendDefinition = async () => (await owner.query<{ def: string }>(
  "SELECT pg_get_functiondef('mirror_managed_resend(text,text,text)'::regprocedure) AS def")).rows[0]!.def;

/** A bound, privileged principal with a fresh passkey session, as the SQL authority checks require. */
async function privilegedActor(kind: "admin" | "manager") {
  const principal = `migration-order-${kind}-${randomUUID()}`, user = randomUUID(), session = randomUUID();
  await owner.query("INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,true,0)", [principal]);
  await owner.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt")
    VALUES ($1,$2,$3,true,now(),now())`, [user, `Synthetic ${kind}`, `${kind}-${user}@mirrorprogress.com`]);
  await owner.query("INSERT INTO mirror_binding(user_id,principal_id) VALUES ($1,$2)", [user, principal]);
  await owner.query(`INSERT INTO "session"(id,token,"userId","expiresAt","createdAt","updatedAt")
    VALUES ($1,$2,$3,now()+interval '1 hour',now(),now())`, [session, randomUUID(), user]);
  await owner.query(`INSERT INTO mirror_assurance(session_id,user_id,principal_id,epoch,mfa_at,factor,expires_at)
    VALUES ($1,$2,$3,0,clock_timestamp(),'passkey_uv',now()+interval '30 minutes')`, [session, user, principal]);
  await owner.query(kind === "admin" ? "INSERT INTO mirror_managed_invitation_admin(principal_id) VALUES ($1)"
    : "INSERT INTO mirror_trial_invitation_manager(principal_id) VALUES ($1)", [principal]);
  actors[kind] = principal; sessions[kind] = session;
}
async function issue(kind: "admin" | "manager", account: "external" | "admin") {
  const target = randomUUID();
  await owner.query("SELECT mirror_managed_issue($1,$2,$3,$4,$5,$6,$7,$8)", [sessions[kind], target, digest(opaqueToken()),
    `${target}@${account === "admin" ? "mirrorprogress.com" : "studio.example"}`, "Synthetic Person",
    account === "admin" ? "Mirror Progress" : "Synthetic Studio", account, account === "admin" ? "project_lead" : "client"]);
  return target;
}
const resend = (kind: "admin" | "manager", target: string) =>
  owner.query("SELECT mirror_managed_resend($1,$2,$3)", [sessions[kind], target, digest(opaqueToken())]);

before(async () => {
  if (!enabled) return;
  const base = new URL(process.env.SELF_SERVE_TEST_OWNER_URL!);
  assert.equal(base.hostname, "127.0.0.1");
  process.env.IDENTITY_LOCAL_PREVIEW = "1";
  const maintenance = new URL(base); maintenance.pathname = "/postgres";
  const admin = new Pool({ connectionString: maintenance.href, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DATABASE}`);
  await admin.end();
  const ownerUrl = new URL(base); ownerUrl.pathname = `/${DATABASE}`;
  const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = RUNTIME; runtimeUrl.password = runtimePassword;
  config = { mode: "production", freshInstall: true, origin: "http://localhost:3040", databaseUrl: runtimeUrl.href,
    secret: randomBytes(48).toString("hex"), sessionStatusSecret: randomBytes(32).toString("hex"),
    bindHost: "127.0.0.1", port: 3040, platformOrigin: "http://127.0.0.1:3031", oidcClientId: "mirror-migration-order-test",
    redirectUris: ["http://127.0.0.1:3031/api/auth/callback"],
    staging: { rpId: "localhost", deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
  owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  // Production as it stands: Better Auth tables, then 001-007 from the live runner list.
  await (await getMigrations(createAuth(config, new StagingStore(owner, config)).options)).runMigrations();
  await runMigrations(PRODUCTION_APPLIED);
  await privilegedActor("admin"); await privilegedActor("manager");
  invited.external = await issue("manager", "external");
  invited.internal = await issue("admin", "admin");
});
after(async () => { await runtime?.end(); await owner?.end(); });

test("production state: 007 lets a trial manager resend external invitations only", { skip: !enabled }, async () => {
  assert.deepEqual((await history()).map(r => r.name), [...PRODUCTION_APPLIED]);
  await resend("manager", invited.external);
  await assert.rejects(resend("manager", invited.internal), { code: "42501" });
  await resend("admin", invited.internal);
});

test("release runner on a 001-007 database applies only 008, keeps 007, and is idempotent", { skip: !enabled }, async () => {
  const beforeRun = await history(), resendBefore = await resendDefinition();
  await applyLocalPreviewSchema(owner, config, runtimePassword, { database: DATABASE, runtimeRole: RUNTIME, operatorRole: OPERATOR });
  const afterRun = await history();
  assert.deepEqual(afterRun.map(r => r.name), [...LOCAL_PREVIEW_MIGRATIONS]);
  // 001-007 were skipped (same checksum, same applied_at); only 008 is new.
  assert.deepEqual(afterRun.slice(0, 7), beforeRun);
  assert.equal(afterRun[7]!.name, "008-self-serve-trial-invitations");
  assert.equal(await resendDefinition(), resendBefore);
  // Second run is a no-op.
  await applyLocalPreviewSchema(owner, config, runtimePassword, { database: DATABASE, runtimeRole: RUNTIME, operatorRole: OPERATOR });
  assert.deepEqual(await history(), afterRun);
  // The plain runner loop agrees.
  await runMigrations(LOCAL_PREVIEW_MIGRATIONS);
  assert.deepEqual(await history(), afterRun);
});

test("a changed checksum for an applied migration stops the runner without changes", { skip: !enabled }, async () => {
  const real = (await owner.query("SELECT checksum FROM mirror_schema_migration WHERE name='007-unified-prospect-invitations'")).rows[0].checksum;
  await owner.query("UPDATE mirror_schema_migration SET checksum=$1 WHERE name='007-unified-prospect-invitations'", ["0".repeat(64)]);
  try {
    await assert.rejects(applyLocalPreviewSchema(owner, config, runtimePassword,
      { database: DATABASE, runtimeRole: RUNTIME, operatorRole: OPERATOR }), /Applied checksum mismatch/);
    await assert.rejects(runMigrations(LOCAL_PREVIEW_MIGRATIONS), /Applied checksum mismatch/);
  } finally {
    await owner.query("UPDATE mirror_schema_migration SET checksum=$1 WHERE name='007-unified-prospect-invitations'", [real]);
  }
});

test("after 008: 007 resend rules hold through the runtime role, including for self-serve invitations", { skip: !enabled }, async () => {
  runtime = new Pool({ connectionString: config.databaseUrl, max: 2 });
  const store = new StagingStore(runtime, config);
  const selfServe = await store.issueSelfServeInvitation({ name: "Sample Person", email: "pat@self-serve.example", company: "Self Serve Co" });
  invited.bySelfServe = (selfServe as { principalId: string }).principalId;
  // The runtime role holds EXECUTE on mirror_managed_resend; the SQL function decides authority.
  assert.deepEqual(await store.resendManagedInvitation(sessions.manager, invited.external), { status: "queued" });
  assert.deepEqual(await store.resendManagedInvitation(sessions.manager, invited.bySelfServe), { status: "queued" });
  await assert.rejects(store.resendManagedInvitation(sessions.manager, invited.internal), { code: "42501" });
  assert.deepEqual(await store.resendManagedInvitation(sessions.admin, invited.internal), { status: "queued" });
  // Revocation is still admin-only.
  await assert.rejects(store.revokeManagedInvitation(sessions.manager, invited.external), { code: "42501" });
  // 008's password factor exists, and a privileged principal still cannot hold password-only evidence.
  await assert.rejects(owner.query("UPDATE mirror_assurance SET factor='password',password_at=mfa_at WHERE session_id=$1",
    [sessions.manager]), { code: "42501" });
  const audits = (await owner.query<{ kind: string; n: number }>(`SELECT kind,count(*)::int AS n FROM mirror_staging_audit
    WHERE kind IN ('managed-resend','self-serve-invite') GROUP BY kind ORDER BY kind`)).rows;
  assert.deepEqual(audits, [{ kind: "managed-resend", n: 5 }, { kind: "self-serve-invite", n: 1 }]);
});

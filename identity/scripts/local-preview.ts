// LOCAL PREVIEW launcher for the Prospect self-serve trial flow. Never used by the service image:
// server.ts does not import it, and every path refuses NODE_ENV=production (set by the Dockerfile).
//   migrate: node --env-file=.env.local-preview --env-file=.env.local-preview.operator dist/scripts/local-preview.js migrate
//   serve:   node --env-file=.env.local-preview dist/scripts/local-preview.js serve
//   invite-admin <email> [name]: node --env-file=.env.local-preview --env-file=.env.local-preview.operator \
//            dist/scripts/local-preview.js invite-admin admin@example.test "Local Admin"
//            Issues a Mirror Progress admin invitation directly in the loopback database (there is no
//            enrolled owner to issue it through the passkey-gated mirror_managed_issue) and queues it like
//            any managed invitation; the running local preview server captures the email in the local
//            outbox. Local preview only; the link is never printed.
//   reset-rate-limits: same env files; clears the loopback database's rate-limit counters, since every
//            scripted preview request comes from 127.0.0.1 (for example invitation-info allows 8 per 15 minutes).
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { assertRuntimeEnvironment } from "../src/core/config.js";
import { createIdentityHttpServer } from "../src/core/http.js";
import { LOCAL_PREVIEW_RUNTIME_ROLE, localPreviewConfig, localPreviewDatabase, localPreviewEnabled,
  localPreviewTransport } from "../src/core/local-preview.js";
import { assertStagingRuntime } from "../src/staging/runtime.js";
import { StagingStore } from "../src/staging/store.js";
import { createAuth } from "../src/auth.js";
import { createApp } from "../src/app.js";
import { applyLocalPreviewSchema } from "./local-preview-schema.js";
import { digest, opaqueToken } from "../src/core/tokens.js";
import { sealDelivery } from "../src/core/delivery.js";

async function migrate() {
  const config = localPreviewConfig();
  const ownerUrl = localPreviewDatabase(process.env.LOCAL_PREVIEW_OWNER_DATABASE_URL ?? "", false);
  const runtime = localPreviewDatabase(config.databaseUrl, true);
  const password = process.env.IDENTITY_RUNTIME_DB_PASSWORD ?? "";
  if (decodeURIComponent(runtime.password) !== password) throw new Error("runtime_password_mismatch");
  const owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  try { await applyLocalPreviewSchema(owner, config, password); }
  finally { await owner.end(); }
  console.info("Local preview identity schema applied (migrations 001-008, least-privilege runtime role).");
}

const LOCAL_PREVIEW_BOOTSTRAP_ACTOR = "local-preview-bootstrap";

async function inviteAdmin(email: string, name: string) {
  const config = localPreviewConfig();
  if (!localPreviewTransport()) throw new Error("local_preview_mail_capture_required");
  const mailbox = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailbox) || mailbox.length > 254 || !name.trim() || name.length > 120) {
    throw new Error("usage: local-preview.js invite-admin <email> [name]");
  }
  const ownerUrl = localPreviewDatabase(process.env.LOCAL_PREVIEW_OWNER_DATABASE_URL ?? "", false);
  const owner = new Pool({ connectionString: ownerUrl.href, max: 1 });
  const token = opaqueToken(), hash = digest(token), target = randomUUID(), delivery = randomUUID();
  const review = "Local preview admin invitation (loopback only)";
  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  const client = await owner.connect();
  try {
    await client.query("BEGIN");
    if ((await client.query('SELECT 1 FROM "user" WHERE email=$1 UNION ALL SELECT 1 FROM mirror_managed_invitation WHERE lower(email)=$1 AND revoked_at IS NULL', [mailbox])).rowCount) {
      throw new Error("local_preview_admin_exists");
    }
    // Same rows mirror_managed_issue writes for an admin invitation; the inviter is a non-privileged bootstrap actor.
    await client.query("INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,false,0) ON CONFLICT (id) DO NOTHING", [LOCAL_PREVIEW_BOOTSTRAP_ACTOR]);
    await client.query("INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,true,0)", [target]);
    await client.query("INSERT INTO mirror_staging_reconciliation(principal_id,epoch,email,reconciler,review_ref) VALUES ($1,0,$2,$3,$4)", [target, mailbox, LOCAL_PREVIEW_BOOTSTRAP_ACTOR, review]);
    await client.query("INSERT INTO mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at) VALUES ($1,$2,0,$3,$4,now(),$5)", [hash, target, mailbox, LOCAL_PREVIEW_BOOTSTRAP_ACTOR, expiresAt]);
    await client.query(`INSERT INTO mirror_managed_invitation(principal_id,invitation_digest,email,display_name,company_name,account_type,requested_role,inviter)
      VALUES ($1,$2,$3,$4,'Mirror Progress','admin','admin',$5)`, [target, hash, mailbox, name.trim(), LOCAL_PREVIEW_BOOTSTRAP_ACTOR]);
    // Queued exactly as StagingStore.issueManagedInvitation does; the serve process delivers it.
    await client.query("INSERT INTO mirror_staging_mailbox(id,invitation_digest,token_digest,expires_at) VALUES ($1,$2,$2,$3)", [delivery, hash, expiresAt]);
    await client.query("INSERT INTO mirror_staging_delivery(id,sealed_payload,purpose) VALUES ($1,$2,'invitation')",
      [delivery, sealDelivery(config.staging!.deliveryKey, delivery, token)]);
    await client.query("INSERT INTO mirror_staging_audit(kind,operator_login,actor,principal_id,epoch,review_ref) VALUES ('managed-invite',session_user,$1,$2,0,$3)", [LOCAL_PREVIEW_BOOTSTRAP_ACTOR, target, review]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); await owner.end(); }
  console.info(`Local preview admin invitation for ${mailbox} queued; the running local preview identity captures it in ${process.env.IDENTITY_LOCAL_PREVIEW_OUTBOX} (principal ${target}).`);
}

async function resetRateLimits() {
  localPreviewConfig();
  const owner = new Pool({ connectionString: localPreviewDatabase(process.env.LOCAL_PREVIEW_OWNER_DATABASE_URL ?? "", false).href, max: 1 });
  try { console.info(`Cleared ${(await owner.query("DELETE FROM mirror_rate_limit")).rowCount ?? 0} local preview rate-limit counters.`); }
  finally { await owner.end(); }
}

async function serve() {
  assertRuntimeEnvironment();
  const config = localPreviewConfig();
  const delivery = localPreviewTransport();
  if (!delivery) throw new Error("local_preview_mail_capture_required");
  // Loopback database without TLS; never a hosted database (localPreviewDatabase enforces this).
  const pool = new Pool({ connectionString: config.databaseUrl, max: 10, connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000, statement_timeout: 10000, application_name: "mirror-identity-local-preview" });
  const { rows } = await pool.query(`SELECT r.rolsuper,r.rolcreatedb,r.rolcreaterole,
    has_table_privilege(current_user,'mirror_principal','UPDATE') AS can_activate,
    has_schema_privilege(current_user,'public','CREATE') AS can_create
    FROM pg_roles r WHERE r.rolname=current_user`);
  const role = rows[0];
  if (!role || role.rolsuper || role.rolcreatedb || role.rolcreaterole || role.can_activate || role.can_create) {
    await pool.end(); throw new Error("Use the least-privilege local preview runtime role");
  }
  await assertStagingRuntime(pool, LOCAL_PREVIEW_RUNTIME_ROLE);
  const store = new StagingStore(pool, config);
  const app = createApp(config, store, createAuth(config, store));
  const server = createIdentityHttpServer(config.origin, app);
  let sending = false;
  const timer = setInterval(() => {
    if (sending) return;
    sending = true;
    void store.dispatchOne(delivery).catch(() => console.error("Local preview delivery failed"))
      .finally(() => { sending = false; });
  }, 1000);
  server.listen(config.port, config.bindHost, () => {
    console.info(`Mirror Identity LOCAL PREVIEW on ${config.origin} (production fresh-install policy, mail captured locally)`);
  });
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, () => {
    clearInterval(timer);
    server.close(() => { void pool.end().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 5_000).unref();
  });
}

if (!localPreviewEnabled()) {
  console.error("Local preview is disabled. It requires IDENTITY_LOCAL_PREVIEW=1, no IDENTITY_MODE and a non-production NODE_ENV.");
  process.exit(1);
}
const command = process.argv[2];
try {
  if (command === "migrate") await migrate();
  else if (command === "serve") await serve();
  else if (command === "invite-admin") await inviteAdmin(process.argv[3] ?? "", process.argv[4] ?? "Local Preview Admin");
  else if (command === "reset-rate-limits") await resetRateLimits();
  else throw new Error("usage: local-preview.js migrate|serve|invite-admin <email> [name]|reset-rate-limits");
} catch (error) {
  console.error("Local preview identity failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
}

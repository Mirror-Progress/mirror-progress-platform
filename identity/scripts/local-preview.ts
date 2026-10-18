// LOCAL PREVIEW launcher for the Prospect self-serve trial flow. Never used by the service image:
// server.ts does not import it, and every path refuses NODE_ENV=production (set by the Dockerfile).
//   migrate: node --env-file=.env.local-preview --env-file=.env.local-preview.operator dist/scripts/local-preview.js migrate
//   serve:   node --env-file=.env.local-preview dist/scripts/local-preview.js serve
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

async function migrate() {
  const config = localPreviewConfig();
  const ownerUrl = localPreviewDatabase(process.env.LOCAL_PREVIEW_OWNER_DATABASE_URL ?? "", false);
  const runtime = localPreviewDatabase(config.databaseUrl, true);
  const password = process.env.IDENTITY_RUNTIME_DB_PASSWORD ?? "";
  if (decodeURIComponent(runtime.password) !== password) throw new Error("runtime_password_mismatch");
  const owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  try { await applyLocalPreviewSchema(owner, config, password); }
  finally { await owner.end(); }
  console.info("Local preview identity schema applied (migrations 001-006 and 008, least-privilege runtime role).");
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
  else throw new Error("usage: local-preview.js migrate|serve");
} catch (error) {
  console.error("Local preview identity failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
}

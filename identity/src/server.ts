import { createReadinessServer } from "./core/readiness.js";
import { readFile } from "node:fs/promises";
import { StagingStore } from "./staging/store.js";
import { PRODUCTION } from "./core/production-config.js";
import { STAGING } from "./core/staging-config.js";
import { assertStagingRuntime } from "./staging/runtime.js";
import { createIdentityHttpServer } from "./core/http.js";
import { loadConfig, assertRuntimeEnvironment } from "./core/config.js";
import { createPool, Store } from "./db.js";
import { createAuth } from "./auth.js";
import { createApp } from "./app.js";
assertRuntimeEnvironment();
const config = loadConfig();
const pool = createPool(config);
// Refuse to run under a superuser, schema owner, or role with principal activation rights.
const { rows: roles } = await pool.query(`SELECT r.rolsuper, r.rolcreatedb, r.rolcreaterole,
  has_table_privilege(current_user,'mirror_principal','UPDATE') AS can_activate,
  has_schema_privilege(current_user,'public','CREATE') AS can_create
  FROM pg_roles r WHERE r.rolname=current_user`);
const role = roles[0];
if (!role || role.rolsuper || role.rolcreatedb || role.rolcreaterole || role.can_activate || role.can_create) {
  await pool.end(); throw new Error("Use the documented least-privilege runtime database role");
}
if ((config.mode === "staging" || config.mode === "production")) await assertStagingRuntime(pool, config.mode === "production" ? PRODUCTION.runtimeRole : STAGING.runtimeRole);
const store = (config.mode === "staging" || config.mode === "production") ? new StagingStore(pool, config) : new Store(pool);
const app = createApp(config, store, createAuth(config, store));
const tls = config.staging ? { cert: await readFile(config.staging.certFile), key: await readFile(config.staging.keyFile) } : undefined;
const server = createIdentityHttpServer(config.origin, app, tls, config.albProxyCidrs);
let draining = false;
const readiness = config.albProxyCidrs ? createReadinessServer(async () => {
  if (draining) throw new Error("draining");
  await pool.query(Object.assign({ text: 'SELECT session_id FROM mirror_assurance LIMIT 0' }, { query_timeout: 3000 }));
}) : undefined;
readiness?.listen(3041, config.bindHost);
server.listen(config.port, config.bindHost, () => {
  console.info(`Mirror Identity ${config.mode ?? "synthetic"} service (release approval is separate from readiness)`);
});
for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, () => {
  draining = true;
  readiness?.close();
  server.close(() => { void pool.end().then(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10_000).unref();
});

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { Pool } from "pg";
import { loadConfig, assertSyntheticDatabase } from "../src/core/config.js";
import { createAuth } from "../src/auth.js";
import { Store } from "../src/db.js";

const config = loadConfig();
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? "";
assertSyntheticDatabase(migrationUrl);
const runtimePassword = process.env.IDENTITY_RUNTIME_DB_PASSWORD ?? "";
if (runtimePassword.length < 24 || /placeholder|replace|change[-_]?me/i.test(runtimePassword)) {
  throw new Error("Set a generated IDENTITY_RUNTIME_DB_PASSWORD (24+ characters)");
}
const db = new Pool({ connectionString: migrationUrl, max: 4 });
const lock = await db.connect();
try {
  await lock.query("SELECT pg_advisory_lock(30401705)");
  const auth = createAuth({ ...config, databaseUrl: migrationUrl }, new Store(db));
  const migrations = await getMigrations(auth.options);
  await mkdir("artifacts", { recursive: true });
  if (migrations.toBeCreated.length || migrations.toBeAdded.length || migrations.toBeAddedIndexes.length) {
    await writeFile("artifacts/better-auth-schema.sql", await migrations.compileMigrations(), { mode: 0o600 });
  }
  await migrations.runMigrations();
  const sql = await readFile("migrations/001-mirror-policy.sql", "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  await lock.query("BEGIN");
  try {
    await lock.query("CREATE TABLE IF NOT EXISTS mirror_schema_migration (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const prior = await lock.query<{ checksum: string }>("SELECT checksum FROM mirror_schema_migration WHERE name=$1", ["001-mirror-policy"]);
    if (prior.rows[0] && prior.rows[0].checksum !== checksum) throw new Error("Applied migration checksum differs; write a new migration");
    if (!prior.rows[0]) {
      await lock.query(sql);
      await lock.query("INSERT INTO mirror_schema_migration(name,checksum) VALUES ($1,$2)", ["001-mirror-policy", checksum]);
    }
    const { rows: roles } = await lock.query("SELECT 1 FROM pg_roles WHERE rolname='mirror_identity_runtime'");
    if (!roles.length) {
      // PostgreSQL DDL cannot bind PASSWORD as a query parameter. Only a server-side
      // SQL-literal-quoted value is used; identifiers are fixed constants.
      const quoted = await lock.query<{ statement: string }>(
        "SELECT format('CREATE ROLE mirror_identity_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L', $1::text) AS statement", [runtimePassword]);
      await lock.query(quoted.rows[0]!.statement);
    }
    await lock.query(`
      REVOKE CREATE ON SCHEMA public FROM PUBLIC;
      GRANT CONNECT ON DATABASE mirror_identity_synthetic TO mirror_identity_runtime;
      GRANT USAGE ON SCHEMA public TO mirror_identity_runtime;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mirror_identity_runtime;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mirror_identity_runtime;
      REVOKE INSERT, UPDATE, DELETE ON mirror_principal, mirror_schema_migration, mirror_security_outbox FROM mirror_identity_runtime;
      REVOKE INSERT, UPDATE, DELETE ON mirror_invitation FROM mirror_identity_runtime;
      GRANT UPDATE (consumed_at) ON mirror_invitation TO mirror_identity_runtime;
      REVOKE UPDATE, DELETE ON mirror_binding FROM mirror_identity_runtime;
      REVOKE INSERT, UPDATE, DELETE ON "oauthClient", "oauthResource", "oauthClientResource" FROM mirror_identity_runtime;
      GRANT EXECUTE ON FUNCTION mirror_revoke_subject(text,text) TO mirror_identity_runtime;
      GRANT EXECUTE ON FUNCTION mirror_lock_principal(text) TO mirror_identity_runtime;
    `);
    await lock.query("COMMIT");
  } catch (error) { await lock.query("ROLLBACK"); throw error; }
  console.info("Synthetic schema applied. Generated Better Auth SQL is in artifacts/better-auth-schema.sql.");
} finally {
  await lock.query("SELECT pg_advisory_unlock(30401705)");
  lock.release(); await db.end();
}

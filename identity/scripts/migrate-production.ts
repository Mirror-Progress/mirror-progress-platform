import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { loadConfig } from "../src/core/config.js";
import { productionDatabase } from "../src/core/production-config.js";
import { createAuth } from "../src/auth.js";
import { StagingStore } from "../src/staging/store.js";
import { productionGrants } from "../src/staging/grants.js";

// Operator-only executable; never imported by server.ts. No remote operations are automatic.
async function main() {
  const config = loadConfig();
  if (config.mode !== "production") throw new Error("Production mode required");
  const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? "";
  const owner = productionDatabase(migrationUrl, false), runtime = productionDatabase(config.databaseUrl, true);
  if (owner.host !== runtime.host || owner.pathname !== runtime.pathname) throw new Error("Database mismatch");
  const password = process.env.IDENTITY_RUNTIME_DB_PASSWORD ?? "";
  if (password.length < 24 || /placeholder|replace|change[-_]?me/i.test(password) ||
      decodeURIComponent(runtime.password) !== password) throw new Error("Runtime password mismatch");
  const db = new Pool({ connectionString: migrationUrl, ssl: { rejectUnauthorized: true }, max: 4 });
  const lock = await db.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(30401705)");
    const auth = createAuth(config, new StagingStore(db, config));
    await (await getMigrations(auth.options)).runMigrations();
    await lock.query("BEGIN");
    try {
      await lock.query(`CREATE TABLE IF NOT EXISTS mirror_schema_migration
        (name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`);
      for (const name of ["001-mirror-policy", "002-staging-enrollment", "003-assisted-recovery", "004-managed-invitations"]) {
        const sql = await readFile(`migrations/${name}.sql`, "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");
        const prior = await lock.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
        if (prior.rows[0] && prior.rows[0].checksum !== checksum) throw new Error("Applied checksum mismatch");
        if (!prior.rows[0]) {
          await lock.query(sql);
          await lock.query("INSERT INTO mirror_schema_migration(name,checksum) VALUES ($1,$2)", [name, checksum]);
        }
      }
      for (const role of ["mirror_identity_production_runtime", "mirror_identity_production_operator"]) {
        const existing = await lock.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role]);
        if (!existing.rows.length) {
          const result = await lock.query(`SELECT format('CREATE ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS %s %s',
            $1::text,$2::text,$3::text) AS statement`, [role,
            role.endsWith("runtime") ? "LOGIN NOINHERIT" : "NOLOGIN NOINHERIT", ""]);
          await lock.query(result.rows[0].statement);
        }
      }
      const quoted = await lock.query("SELECT format('ALTER ROLE mirror_identity_production_runtime PASSWORD %L',$1::text) AS statement", [password]);
      await lock.query(quoted.rows[0].statement);
      await lock.query(productionGrants);
      await lock.query(`GRANT CONNECT ON DATABASE mirror_identity_production
        TO mirror_identity_production_runtime,mirror_identity_production_operator`);
      await lock.query(`INSERT INTO "oauthClient"
        (id,"clientId",name,"redirectUris",scopes,"grantTypes","responseTypes","tokenEndpointAuthMethod",
        "requirePKCE",disabled,"skipConsent","subjectType","clientCredentialsScopes","createdAt","updatedAt")
        VALUES ($1,$2,'Mirror production',$3::jsonb,'["openid","profile","email"]'::jsonb,
          '["authorization_code"]'::jsonb,'["code"]'::jsonb,'none',true,false,true,'public','[]'::jsonb,now(),now())
        ON CONFLICT ("clientId") DO NOTHING`, [randomUUID(), config.oidcClientId, JSON.stringify(config.redirectUris)]);
      const client = await lock.query(`SELECT "redirectUris","requirePKCE","tokenEndpointAuthMethod",disabled,
        "grantTypes","responseTypes",scopes FROM "oauthClient" WHERE "clientId"=$1`, [config.oidcClientId]);
      const c = client.rows[0];
      if (!c || c.disabled || !c.requirePKCE || c.tokenEndpointAuthMethod !== "none" ||
          JSON.stringify(c.redirectUris) !== JSON.stringify(config.redirectUris) ||
          JSON.stringify(c.grantTypes) !== '["authorization_code"]' || JSON.stringify(c.responseTypes) !== '["code"]' ||
          JSON.stringify(c.scopes) !== '["openid","profile","email"]') throw new Error("Existing client configuration differs");
      await lock.query("COMMIT");
    } catch (error) { await lock.query("ROLLBACK"); throw error; }
    console.info("Production candidate schema applied; operator mappings and release review still required.");
  } finally {
    await lock.query("SELECT pg_advisory_unlock(30401705)"); lock.release(); await db.end();
  }
}
try { await main(); } catch { console.error("Production migration failed; inspect privately without logging credentials."); process.exitCode = 1; }

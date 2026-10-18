import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import type { Config } from "../src/core/config.js";
import { createAuth } from "../src/auth.js";
import { StagingStore } from "../src/staging/store.js";
import { stagingGrants } from "../src/staging/grants.js";
import { LOCAL_PREVIEW_DATABASE, LOCAL_PREVIEW_RUNTIME_ROLE, localPreviewEnabled } from "../src/core/local-preview.js";

// Same ordered, checksummed migrations as scripts/migrate-production.ts and scripts/migrate-staging.ts.
// 007 is intentionally absent: it is not on main and 008 does not depend on it.
export const LOCAL_PREVIEW_MIGRATIONS = ["001-mirror-policy", "002-staging-enrollment", "003-assisted-recovery",
  "004-managed-invitations", "005-admin-invitation-authority", "006-trial-invitation-manager",
  "008-self-serve-trial-invitations"] as const;
export const LOCAL_PREVIEW_OPERATOR_ROLE = "mirror_identity_local_preview_operator";

/** Applies the production schema and least-privilege grants to the loopback preview database. */
export async function applyLocalPreviewSchema(owner: Pool, config: Config, runtimePassword: string,
  options: { database?: string; runtimeRole?: string; operatorRole?: string } = {}): Promise<void> {
  const database = options.database ?? LOCAL_PREVIEW_DATABASE;
  const runtimeRole = options.runtimeRole ?? LOCAL_PREVIEW_RUNTIME_ROLE;
  const operatorRole = options.operatorRole ?? LOCAL_PREVIEW_OPERATOR_ROLE;
  if (!localPreviewEnabled()) throw new Error("local_preview_disabled");
  if (runtimePassword.length < 24) throw new Error("runtime_password_required");
  const lock = await owner.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(30401705)");
    const auth = createAuth(config, new StagingStore(owner, config));
    await (await getMigrations(auth.options)).runMigrations();
    await lock.query("BEGIN");
    try {
      await lock.query(`CREATE TABLE IF NOT EXISTS mirror_schema_migration
        (name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`);
      for (const name of LOCAL_PREVIEW_MIGRATIONS) {
        const sql = await readFile(`migrations/${name}.sql`, "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");
        const prior = await lock.query("SELECT checksum FROM mirror_schema_migration WHERE name=$1", [name]);
        if (prior.rows[0] && prior.rows[0].checksum !== checksum) throw new Error("Applied checksum mismatch");
        if (!prior.rows[0]) {
          await lock.query(sql);
          await lock.query("INSERT INTO mirror_schema_migration(name,checksum) VALUES ($1,$2)", [name, checksum]);
        }
      }
      for (const role of [runtimeRole, operatorRole]) {
        const existing = await lock.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role]);
        if (!existing.rows.length) {
          const created = await lock.query(`SELECT format('CREATE ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS %s',
            $1::text,$2::text) AS statement`, [role, role === runtimeRole ? "LOGIN NOINHERIT" : "NOLOGIN NOINHERIT"]);
          await lock.query(created.rows[0].statement);
        }
      }
      const quoted = await lock.query("SELECT format('ALTER ROLE %I PASSWORD %L',$1::text,$2::text) AS statement",
        [runtimeRole, runtimePassword]);
      await lock.query(quoted.rows[0].statement);
      await lock.query(stagingGrants.replaceAll("mirror_identity_staging_runtime", runtimeRole)
        .replaceAll("mirror_identity_staging_operator", operatorRole));
      const connect = await lock.query("SELECT format('GRANT CONNECT ON DATABASE %I TO %I',$1::text,$2::text) AS statement",
        [database, runtimeRole]);
      await lock.query(connect.rows[0].statement);
      await lock.query(`INSERT INTO "oauthClient"
        (id,"clientId",name,"redirectUris",scopes,"grantTypes","responseTypes","tokenEndpointAuthMethod",
        "requirePKCE",disabled,"skipConsent","subjectType","clientCredentialsScopes","createdAt","updatedAt")
        VALUES ($1,$2,'Mirror local preview',$3::jsonb,'["openid","profile","email"]'::jsonb,
          '["authorization_code"]'::jsonb,'["code"]'::jsonb,'none',true,false,true,'public','[]'::jsonb,now(),now())
        ON CONFLICT ("clientId") DO UPDATE SET "redirectUris"=EXCLUDED."redirectUris"`,
        [randomUUID(), config.oidcClientId, JSON.stringify(config.redirectUris)]);
      await lock.query("COMMIT");
    } catch (error) { await lock.query("ROLLBACK"); throw error; }
  } finally {
    await lock.query("SELECT pg_advisory_unlock(30401705)").catch(() => undefined);
    lock.release();
  }
}

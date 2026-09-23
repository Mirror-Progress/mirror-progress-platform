import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { Pool } from "pg";
import { assertSyntheticDatabase, loadConfig } from "../src/core/config.js";
import { opaqueToken, digest } from "../src/core/tokens.js";
const config = loadConfig();
const url = process.env.MIGRATION_DATABASE_URL ?? "";
assertSyntheticDatabase(url);
const db = new Pool({ connectionString: url });
const connection = await db.connect();
let fileCreated = false;
try {
  await connection.query("BEGIN");
  await connection.query(`INSERT INTO mirror_principal(id) VALUES ('mp-synthetic-ordinary') ON CONFLICT DO NOTHING`);
  const bound = await connection.query("SELECT 1 FROM mirror_binding WHERE principal_id='mp-synthetic-ordinary'");
  if (bound.rows.length) throw new Error("Synthetic principal is already enrolled. Existing credentials were not replaced.");
  const token = opaqueToken();
  await connection.query(`INSERT INTO mirror_invitation(digest,principal_id,email,issuer_ref,evidence_kind,expires_at)
    VALUES ($1,'mp-synthetic-ordinary','ordinary@example.invalid','synthetic-local-operator','synthetic-only',now()+interval '10 minutes')`, [digest(token)]);
  // Server-owned first-party client. This is a local seed, NOT dynamic registration.
  // Pinned v1.7.5's PostgreSQL schema stores string[] fields as jsonb.
  await connection.query(`INSERT INTO "oauthClient"
    (id,"clientId",name,"redirectUris",scopes,"grantTypes","responseTypes","tokenEndpointAuthMethod",
     "requirePKCE",disabled,"skipConsent","subjectType","clientCredentialsScopes","createdAt","updatedAt")
    VALUES ($1,$2,'Mirror local synthetic client',$3::jsonb,$4::jsonb,'["authorization_code"]'::jsonb,
      '["code"]'::jsonb,'none',true,false,true,'public','[]'::jsonb,now(),now())
    ON CONFLICT ("clientId") DO NOTHING`, [randomUUID(), config.oidcClientId,
      JSON.stringify(config.redirectUris), JSON.stringify(["openid", "profile", "email"])]);
  await writeFile("synthetic-invitation.json", JSON.stringify({
    warning: "Synthetic data only. Never email this fixture or use it in production.",
    email: "ordinary@example.invalid", invitation: token, origin: config.origin,
    expiresInSeconds: 600,
  }, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  fileCreated = true;
  await connection.query("COMMIT");
  console.info("Synthetic invitation written to local mode-0600 file synthetic-invitation.json. No email sent.");
} catch (error) { await connection.query("ROLLBACK"); if (fileCreated) await unlink("synthetic-invitation.json").catch(() => {}); throw error; }
finally { connection.release(); await db.end(); }

import { stagingContainerEnvironment } from "../src/core/container-config.js";
try {
  const owner: unknown = JSON.parse(process.env.IDENTITY_OWNER_CREDENTIALS ?? "null");
  if (!owner || typeof owner !== "object") throw new Error("owner_credentials_required");
  const c = owner as Record<string, unknown>;
  if (c.username !== "mirror_identity_owner" || typeof c.password !== "string" || c.password.length < 24 ||
      c.host !== process.env.IDENTITY_DATABASE_HOST || c.port !== 5432 || c.engine !== "postgres" ||
      c.dbname !== "mirror_identity_staging") throw new Error("invalid_owner_credentials");
  const input = { ...process.env }; delete input.IDENTITY_OWNER_CREDENTIALS;
  const env = stagingContainerEnvironment(input), url = new URL(env.DATABASE_URL!);
  env.IDENTITY_RUNTIME_DB_PASSWORD = decodeURIComponent(url.password);
  url.username = c.username; url.password = c.password;
  env.MIGRATION_DATABASE_URL = url.toString();
  delete process.env.IDENTITY_OWNER_CREDENTIALS;
  delete process.env.IDENTITY_RUNTIME_CREDENTIALS; delete process.env.IDENTITY_DELIVERY_SEED;
  Object.assign(process.env, env);
  await import("./migrate-staging.js");
} catch { console.error("Identity staging migration bootstrap failed; no credentials logged."); process.exitCode = 1; }

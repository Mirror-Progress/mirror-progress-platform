import { createHash } from "node:crypto";
import { assertRuntimeEnvironment, loadConfig } from "./config.js";
import { STAGING } from "./staging-config.js";
/** Convert ECS-injected Secrets Manager values without fetching secrets or exposing the owner credential. */
export function stagingContainerEnvironment(input: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  assertRuntimeEnvironment(input);
  if (input.IDENTITY_MODE !== "staging" || input.IDENTITY_TRANSPORT !== "alb" || input.IDENTITY_OWNER_CREDENTIALS) throw new Error("staging_runtime_only");
  const credentials: unknown = JSON.parse(input.IDENTITY_RUNTIME_CREDENTIALS ?? "null");
  if (!credentials || typeof credentials !== "object") throw new Error("runtime_credentials_required");
  const c = credentials as Record<string, unknown>;
  if (c.username !== STAGING.runtimeRole || c.dbname !== "mirror_identity_staging" || c.engine !== "postgres" ||
      c.port !== 5432 || typeof c.password !== "string" || !/^[A-Za-z0-9]{64}$/.test(c.password)) throw new Error("invalid_runtime_credentials");
  const host = input.IDENTITY_DATABASE_HOST ?? "";
  if (!/^[a-z0-9-]+\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/.test(host)) throw new Error("staging_rds_host_required");
  const seed = input.IDENTITY_DELIVERY_SEED ?? "";
  if (!/^[A-Za-z0-9]{64}$/.test(seed) || seed === input.BETTER_AUTH_SECRET || seed === input.IDENTITY_SESSION_STATUS_SECRET) throw new Error("separate_delivery_seed_required");
  const url = new URL(`postgresql://${host}:5432/mirror_identity_staging`);
  url.username = STAGING.runtimeRole; url.password = c.password;
  const env: NodeJS.ProcessEnv = { ...input, DATABASE_URL: url.toString(),
    IDENTITY_DELIVERY_KEY: createHash("sha256").update(seed).digest("base64url"),
    IDENTITY_TLS_CERT_FILE: "/run/identity/server.crt", IDENTITY_TLS_KEY_FILE: "/run/identity/server.key" };
  delete env.IDENTITY_RUNTIME_CREDENTIALS; delete env.IDENTITY_DELIVERY_SEED;
  loadConfig(env);
  return env;
}

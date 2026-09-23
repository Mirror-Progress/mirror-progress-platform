import { PolicyError } from "./policy.js";
import { loadProductionConfig } from "./production-config.js";
import { loadStagingConfig } from "./staging-config.js";
export interface Config {
  sessionStatusSecret?: string;
  albProxyCidrs?: readonly string[];
  mode?: "staging" | "production";
  staging?: { rpId: string; deliveryKey: string; certFile: string; keyFile: string };
  origin: string;
  databaseUrl: string;
  secret: string;
  bindHost: string;
  port: number;
  oidcClientId: string;
  redirectUris: readonly string[];
}
export function assertSyntheticDatabase(url: string): void {
  const parsed = new URL(url);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) ||
      !["localhost", "127.0.0.1", "postgres"].includes(parsed.hostname) ||
      parsed.pathname !== "/mirror_identity_synthetic") {
    throw new PolicyError("synthetic_local_database_required", 500);
  }
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env.IDENTITY_MODE === "production") return loadProductionConfig(env);
  if (env.IDENTITY_MODE === "staging") return loadStagingConfig(env);
  if (env.IDENTITY_MODE !== "synthetic") throw new PolicyError("synthetic_mode_required", 500);
  const origin = env.IDENTITY_ORIGIN ?? "http://localhost:3040";
  if (origin !== "http://localhost:3040") throw new PolicyError("production_readiness_blocked", 500);
  const databaseUrl = env.DATABASE_URL ?? "";
  assertSyntheticDatabase(databaseUrl);
  const secret = env.BETTER_AUTH_SECRET ?? "";
  if (secret.length < 48 || /replace|placeholder|change[-_]?me/i.test(secret)) {
    throw new PolicyError("strong_auth_secret_required", 500);
  }
  const bindHost = env.IDENTITY_BIND_HOST ?? "127.0.0.1";
  if (!["127.0.0.1", "0.0.0.0"].includes(bindHost)) throw new PolicyError("invalid_bind_host", 500);
  return {
    origin, databaseUrl, secret, bindHost, port: 3040,
    oidcClientId: "mirror-local-synthetic",
    // No wildcard, URL normalization, dynamic port, or caller-controlled redirect registration.
    redirectUris: ["http://localhost:3000/api/auth/callback"],
  };
}

export function sessionStatusSecret(env: NodeJS.ProcessEnv): string | undefined {
  const value = env.IDENTITY_SESSION_STATUS_SECRET;
  if (value === undefined) return undefined; // Endpoint is unavailable until explicitly configured.
  if (value.length < 48 || value.length > 256 || /replace|placeholder|change[-_]?me/i.test(value) ||
      value === env.BETTER_AUTH_SECRET || value === env.IDENTITY_DELIVERY_KEY) throw new PolicyError("separate_session_status_secret_required", 500);
  return value;
}

/** A service process must not receive migration/operator credentials. */
export function assertRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  for (const name of ["IDENTITY_OWNER_CREDENTIALS", "MIGRATION_DATABASE_URL", "IDENTITY_RUNTIME_DB_PASSWORD", "POSTGRES_PASSWORD", "IDENTITY_OPERATOR_DATABASE_URL", "OPERATOR_DATABASE_URL"]) {
    if (env[name]) throw new PolicyError("operator_credentials_in_runtime_environment", 500);
  }
}

import { PolicyError } from "./policy.js";
export interface Config {
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

/** A service process must not receive migration/operator credentials. */
export function assertRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  for (const name of ["MIGRATION_DATABASE_URL", "IDENTITY_RUNTIME_DB_PASSWORD", "POSTGRES_PASSWORD"]) {
    if (env[name]) throw new PolicyError("operator_credentials_in_runtime_environment", 500);
  }
}

import type { Config } from "./config.js";
import { hostedDatabase, loadHostedConfig, type HostedProfile } from "./staging-config.js";
// Exact production trust bundle. No staging role, database, RP or redirect is accepted.
export const PRODUCTION: HostedProfile = Object.freeze({ mode: "production",
  origin: "https://accounts.mirrorprogress.com", rpId: "accounts.mirrorprogress.com",
  clientId: "mirror-production", redirect: "https://platform.mirrorprogress.com/api/auth/callback",
  runtimeRole: "mirror_identity_production_runtime", database: "mirror_identity_production" });
export function productionDatabase(url: string, runtime: boolean): URL { return hostedDatabase(url, runtime, PRODUCTION); }
export function loadProductionConfig(env: NodeJS.ProcessEnv): Config {
  const config = loadHostedConfig(env, PRODUCTION);
  if (!config.sessionStatusSecret) throw new Error("production_session_status_secret_required");
  if (env.IDENTITY_ACCOUNT_MODE && env.IDENTITY_ACCOUNT_MODE !== "fresh") throw new Error("invalid_production_account_mode");
  config.freshInstall = env.IDENTITY_ACCOUNT_MODE === "fresh";
  return config;
}

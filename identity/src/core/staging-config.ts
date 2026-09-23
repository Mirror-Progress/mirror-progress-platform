import type { Config } from "./config.js";
import { PolicyError } from "./policy.js";
// A bounded staging trust bundle, NOT production approval or DNS provisioning.
export const STAGING = Object.freeze({
  origin: "https://accounts.staging.mirrorprogress.com",
  rpId: "accounts.staging.mirrorprogress.com",
  clientId: "mirror-staging",
  redirect: "https://staging.mirrorprogress.com/api/auth/callback",
  runtimeRole: "mirror_identity_staging_runtime",
});
export function stagingDatabase(url: string, runtime: boolean): URL {
  let u: URL;
  try { u = new URL(url); } catch { throw new PolicyError("staging_database_role_required", 500); }
  if (!["postgres:", "postgresql:"].includes(u.protocol) || u.pathname !== "/mirror_identity_staging" ||
      !u.hostname || !u.username || !u.password || u.search || u.hash ||
      (runtime ? u.username !== STAGING.runtimeRole : u.username === STAGING.runtimeRole)) {
    throw new PolicyError("staging_database_role_required", 500);
  }
  return u;
}
export function loadStagingConfig(env: NodeJS.ProcessEnv): Config {
  let redirects: unknown;
  try { redirects = JSON.parse(env.IDENTITY_REDIRECT_URIS ?? "null"); } catch { /* rejected below */ }
  if (env.IDENTITY_ORIGIN !== STAGING.origin || env.IDENTITY_RP_ID !== STAGING.rpId ||
      env.IDENTITY_OIDC_CLIENT_ID !== STAGING.clientId || !Array.isArray(redirects) ||
      redirects.length !== 1 || redirects[0] !== STAGING.redirect) {
    throw new PolicyError("staging_allowlist_mismatch", 500);
  }
  const databaseUrl = env.DATABASE_URL ?? "";
  stagingDatabase(databaseUrl, true);
  const secret = env.BETTER_AUTH_SECRET ?? "";
  if (secret.length < 48 || /replace|placeholder|change[-_]?me/i.test(secret)) {
    throw new PolicyError("strong_auth_secret_required", 500);
  }
  const deliveryKey = env.IDENTITY_DELIVERY_KEY ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(deliveryKey) || Buffer.from(deliveryKey, "base64url").length !== 32 ||
      Buffer.from(deliveryKey, "base64url").toString("base64url") !== deliveryKey || deliveryKey === secret) {
    throw new PolicyError("separate_delivery_key_required", 500);
  }
  const certFile = env.IDENTITY_TLS_CERT_FILE ?? "", keyFile = env.IDENTITY_TLS_KEY_FILE ?? "";
  if (!certFile.startsWith("/") || !keyFile.startsWith("/") || certFile === keyFile) {
    throw new PolicyError("staging_tls_files_required", 500);
  }
  if (env.IDENTITY_BIND_HOST && env.IDENTITY_BIND_HOST !== "127.0.0.1") {
    throw new PolicyError("staging_loopback_listener_required", 500);
  }
  return { mode: "staging", origin: STAGING.origin, databaseUrl, secret, bindHost: "127.0.0.1", port: 3040,
    oidcClientId: STAGING.clientId, redirectUris: [STAGING.redirect],
    staging: { rpId: STAGING.rpId, deliveryKey, certFile, keyFile } };
}

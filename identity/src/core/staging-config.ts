import type { Config } from "./config.js";
import { sessionStatusSecret } from "./config.js";
import { trustedAlbPeers } from "./proxy.js";
import { PolicyError } from "./policy.js";
// A bounded staging trust bundle, NOT production approval or DNS provisioning.
export const STAGING = Object.freeze({
  origin: "https://accounts.staging.mirrorprogress.com",
  rpId: "accounts.staging.mirrorprogress.com",
  clientId: "mirror-staging",
  redirect: "https://staging.mirrorprogress.com/api/auth/callback",
  runtimeRole: "mirror_identity_staging_runtime",
});
export interface HostedProfile { mode: "staging" | "production"; origin: string; rpId: string; clientId: string; redirect: string; runtimeRole: string; database: string; }
export const STAGING_PROFILE: HostedProfile = Object.freeze({ ...STAGING, mode: "staging", database: "mirror_identity_staging" });
export function stagingDatabase(url: string, runtime: boolean): URL { return hostedDatabase(url, runtime, STAGING_PROFILE); }
export function hostedDatabase(url: string, runtime: boolean, profile: HostedProfile): URL {
  let u: URL;
  try { u = new URL(url); } catch { throw new PolicyError("staging_database_role_required", 500); }
  if (!["postgres:", "postgresql:"].includes(u.protocol) || u.pathname !== `/${profile.database}` ||
      !u.hostname || !/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(u.username) || !u.password || u.search || u.hash ||
      (profile.mode === "production" && (u.username.startsWith("mirror_identity_staging_") || u.username === "mirror_identity_owner")) ||
      (profile.mode === "staging" && u.username.startsWith("mirror_identity_production_")) ||
      (runtime ? u.username !== profile.runtimeRole : u.username === profile.runtimeRole)) {
    throw new PolicyError("staging_database_role_required", 500);
  }
  return u;
}
export function loadStagingConfig(env: NodeJS.ProcessEnv): Config { return loadHostedConfig(env, STAGING_PROFILE); }
export function loadHostedConfig(env: NodeJS.ProcessEnv, profile: HostedProfile): Config {
  if (env.IDENTITY_MODE !== profile.mode) throw new PolicyError("identity_profile_mismatch", 500);
  let redirects: unknown;
  try { redirects = JSON.parse(env.IDENTITY_REDIRECT_URIS ?? "null"); } catch { /* rejected below */ }
  if (env.IDENTITY_ORIGIN !== profile.origin || env.IDENTITY_RP_ID !== profile.rpId ||
      env.IDENTITY_OIDC_CLIENT_ID !== profile.clientId || !Array.isArray(redirects) ||
      redirects.length !== 1 || redirects[0] !== profile.redirect) {
    throw new PolicyError("staging_allowlist_mismatch", 500);
  }
  const databaseUrl = env.DATABASE_URL ?? "";
  hostedDatabase(databaseUrl, true, profile);
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
  let albProxyCidrs: string[] | undefined;
  if (env.IDENTITY_TRANSPORT === "alb") {
    if (env.IDENTITY_BIND_HOST !== "0.0.0.0") throw new PolicyError("alb_listener_required", 500);
    albProxyCidrs = (env.IDENTITY_ALB_SUBNET_CIDRS ?? "").split(",");
    trustedAlbPeers(albProxyCidrs);
  } else if (env.IDENTITY_TRANSPORT || env.IDENTITY_ALB_SUBNET_CIDRS) {
    throw new PolicyError("invalid_staging_transport", 500);
  } else if (env.IDENTITY_BIND_HOST && env.IDENTITY_BIND_HOST !== "127.0.0.1") {
    throw new PolicyError("staging_loopback_listener_required", 500);
  }
  return { mode: profile.mode, origin: profile.origin, databaseUrl, secret, bindHost: albProxyCidrs ? "0.0.0.0" : "127.0.0.1", port: 3040, albProxyCidrs,
    sessionStatusSecret: sessionStatusSecret(env),
    oidcClientId: profile.clientId, redirectUris: [profile.redirect],
    staging: { rpId: profile.rpId, deliveryKey, certFile, keyFile } };
}

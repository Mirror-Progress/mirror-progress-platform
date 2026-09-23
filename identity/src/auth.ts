import { AsyncLocalStorage } from "node:async_hooks";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { jwt, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { oauthProvider } from "@better-auth/oauth-provider";
import type { Config } from "./core/config.js";
import { Store } from "./db.js";
import { verifiedFactor } from "./core/policy.js";

export const ceremony = new AsyncLocalStorage<{ passkeyVerifiedAt?: number }>();
export function createAuth(config: Config, store: Store) {
  const sessionClaims = async (sessionId: string | undefined, userId?: string) => {
    if (!sessionId || !userId) throw new APIError("UNAUTHORIZED", { message: "MFA session required" });
    const { principal, evidence } = await store.authorize(sessionId, userId);
    // Do not override sub, acr, amr, or auth_time: v1.7.5 reserves those claims.
    // Relying parties must consume the explicit issuer+sub mapping and these namespaced claims.
    return {
      "https://mirrorprogress.com/principal_id": principal.id,
      "https://mirrorprogress.com/authorization_epoch": principal.epoch,
      "https://mirrorprogress.com/assurance": {
        version: 1, session_id: sessionId,
        method: evidence.factor, verified_at: Math.floor(evidence.mfaAt! / 1000),
        password_verified_at: evidence.passwordAt === null ? null : Math.floor(evidence.passwordAt / 1000),
        expires_at: Math.floor(evidence.expiresAt / 1000),
      },
    };
  };
  return betterAuth({
    appName: "Mirror Identity",
    baseURL: config.origin,
    basePath: "/api/auth",
    secret: config.secret,
    database: store.pool,
    trustedOrigins: [config.origin],
    logger: { disabled: true },
    emailAndPassword: {
      enabled: true, disableSignUp: true, minPasswordLength: 14, maxPasswordLength: 128,
      // Synthetic enrollment never claims mailbox ownership. Production start is blocked.
      requireEmailVerification: config.mode === "staging",
    },
    account: { accountLinking: { enabled: false } },
    session: { expiresIn: 8 * 60 * 60, updateAge: 60 * 60, cookieCache: { enabled: false } },
    advanced: {
      // Only the transport-owned address injected by createApp is trusted.
      ipAddress: { ipAddressHeaders: ["x-mirror-transport-ip"] },
      cookiePrefix: "mirror_identity", useSecureCookies: config.mode === "staging",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      crossSubDomainCookies: { enabled: false },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    disabledPaths: ["/sign-up/email", "/request-password-reset", "/reset-password", "/send-verification-email",
      "/verify-email", "/change-email", "/update-user", "/delete-user", "/token"],
    plugins: [
      twoFactor({
        issuer: "Mirror Identity", skipVerificationOnEnable: false, twoFactorCookieMaxAge: 300,
        accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
        backupCodeOptions: { amount: 10, length: 20, storeBackupCodes: "encrypted" },
      }),
      passkey({
        rpID: config.staging?.rpId ?? "localhost", rpName: "Mirror Identity", origin: config.origin,
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
        registration: { requireSession: true },
        authentication: {
          // This is a REAL exported v1.7.5 hook, receiving the verified library result.
          afterVerification: async ({ verification }) => {
            verifiedFactor("passkey_authentication", {
              verified: verification.verified,
              userVerified: verification.authenticationInfo.userVerified,
            });
            const scope = ceremony.getStore();
            if (!scope) throw new APIError("FORBIDDEN", { message: "Trusted ceremony boundary required" });
            scope.passkeyVerifiedAt = Date.now();
          },
        },
      }),
      jwt(),
      oauthProvider({
        loginPage: "/", consentPage: "/consent",
        scopes: ["openid", "profile", "email"], grantTypes: ["authorization_code"],
        codeExpiresIn: 60, accessTokenExpiresIn: 300, idTokenExpiresIn: 300,
        allowDynamicClientRegistration: false, allowUnauthenticatedClientRegistration: false,
        allowPublicClientPrelogin: false,
        clientPrivileges: () => false, resourcePrivileges: () => false,
        extensions: [{
          claims: {
            accessToken: ({ sessionId, user }) => sessionClaims(sessionId, user?.id),
            idToken: ({ sessionId, user }) => sessionClaims(sessionId, user?.id),
            userInfo: ({ jwt: payload, user }) => sessionClaims(typeof payload.sid === "string" ? payload.sid : undefined, user.id),
          },
        }],
      }),
    ],
  });
}
export type MirrorAuth = ReturnType<typeof createAuth>;

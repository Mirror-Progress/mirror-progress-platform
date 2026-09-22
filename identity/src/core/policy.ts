/** Authorization inputs are constructed on the server from the database only. */
export type Factor = "password_totp" | "passkey_uv";
export interface Principal {
  id: string;
  disabled: boolean;
  privileged: boolean;
  epoch: string;
}
export interface Evidence {
  sessionId: string;
  userId: string;
  principalId: string;
  epoch: string;
  passwordAt: number | null;
  mfaAt: number | null;
  factor: Factor | null;
  expiresAt: number;
}
export interface LiveSession {
  id: string;
  userId: string;
  expiresAt: number;
}
export class PolicyError extends Error {
  constructor(public readonly code: string, public readonly status = 403) {
    super(code);
    this.name = "PolicyError";
  }
}
export const MFA_MAX_AGE_MS = 60 * 60 * 1000;
export const STEP_UP_MAX_AGE_MS = 5 * 60 * 1000;
export const PASSWORD_FLOW_MAX_AGE_MS = 5 * 60 * 1000;
export function assertOrdinaryPrincipal(principal: Principal): void {
  if (principal.disabled) throw new PolicyError("principal_disabled");
  // Deliberate release gate: there is NO caller-controlled approval bypass.
  if (principal.privileged) throw new PolicyError("independent_approval_not_implemented");
}
export function assertAuthorized(
  principal: Principal,
  live: LiveSession,
  evidence: Evidence | null,
  now: number,
  maxAgeMs = MFA_MAX_AGE_MS,
): Evidence {
  assertOrdinaryPrincipal(principal);
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) throw new PolicyError("invalid_clock");
  if (!evidence || evidence.sessionId !== live.id || evidence.userId !== live.userId ||
      evidence.principalId !== principal.id || evidence.epoch !== principal.epoch) {
    throw new PolicyError("mfa_required", 401);
  }
  if (!Number.isFinite(live.expiresAt) || !Number.isFinite(evidence.expiresAt) ||
      live.expiresAt <= now || evidence.expiresAt <= now || evidence.mfaAt === null || !Number.isFinite(evidence.mfaAt) ||
      evidence.mfaAt > now || now - evidence.mfaAt >= maxAgeMs) {
    throw new PolicyError("mfa_expired", 401);
  }
  if (evidence.factor === "password_totp") {
    if (evidence.passwordAt === null || !Number.isFinite(evidence.passwordAt) || evidence.passwordAt > evidence.mfaAt ||
        evidence.mfaAt - evidence.passwordAt >= PASSWORD_FLOW_MAX_AGE_MS) {
      throw new PolicyError("password_ceremony_missing", 401);
    }
  } else if (evidence.factor !== "passkey_uv") {
    throw new PolicyError("mfa_required", 401);
  }
  return evidence;
}
/** No registration event is accepted by this function. */
export function verifiedFactor(
  kind: "totp_authentication" | "passkey_authentication",
  result: { verified: boolean; userVerified?: boolean },
): Factor {
  if (!result.verified) throw new PolicyError("factor_not_verified", 401);
  if (kind === "totp_authentication") return "password_totp";
  if (kind !== "passkey_authentication") throw new PolicyError("unsupported_ceremony", 401);
  if (result.userVerified !== true) throw new PolicyError("passkey_user_verification_required", 401);
  return "passkey_uv";
}
export function validateAuthorizationQuery(params: URLSearchParams, client: {
  id: string;
  redirectUris: readonly string[];
}): void {
  const allowed = new Set(["client_id", "redirect_uri", "response_type", "scope", "state",
    "nonce", "code_challenge", "code_challenge_method"]);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1) {
      throw new PolicyError("unsupported_or_duplicate_authorization_parameter", 400);
    }
  }
  if (params.get("client_id") !== client.id ||
      !client.redirectUris.includes(params.get("redirect_uri") ?? "")) {
    throw new PolicyError("invalid_client_or_redirect_uri", 400);
  }
  if (params.get("response_type") !== "code" || params.get("code_challenge_method") !== "S256" ||
      !/^[A-Za-z0-9_-]{43}$/.test(params.get("code_challenge") ?? "")) {
    throw new PolicyError("authorization_code_s256_required", 400);
  }
  for (const name of ["state", "nonce"]) {
    const value = params.get(name) ?? "";
    if (value.length < 16 || value.length > 512) throw new PolicyError(`invalid_${name}`, 400);
  }
  const scopes = (params.get("scope") ?? "").split(" ");
  if (!scopes.includes("openid") || scopes.some((s) => !["openid", "profile", "email"].includes(s))) {
    throw new PolicyError("invalid_scope", 400);
  }
}
export function safeResumePath(input: string | null): string | null {
  if (!input || !input.startsWith("/api/auth/oauth2/authorize?") ||
      /[\r\n\\]/.test(input)) return null;
  const parsed = new URL(input, "http://localhost:3040");
  return parsed.origin === "http://localhost:3040" && parsed.pathname === "/api/auth/oauth2/authorize"
    ? parsed.pathname + parsed.search : null;
}

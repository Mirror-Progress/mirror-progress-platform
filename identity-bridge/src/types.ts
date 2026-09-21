import type { JWTVerifyGetKey } from 'jose';

export type SigningAlgorithm = 'RS256' | 'PS256' | 'ES256' | 'EdDSA';

export type VerifiedAssurance = Readonly<{
  kind: 'passkey-uv' | 'pwd-otp';
  /** Exact, server-allowlisted, issuer-defined authentication context. */
  acr: string;
}>;

/** Authentication only. No principal, tenant, role, membership, or session is created. */
export interface Identity {
  readonly issuer: string;
  readonly subject: string;
  /** Exact signed address, or null when omitted. Never a linking key. */
  readonly email: string | null;
  readonly emailVerified: boolean;
  /** Integer Unix seconds of the ceremony attested by the issuer, not callback time. */
  readonly authTime: number;
  readonly amr: readonly string[];
  readonly assurance: VerifiedAssurance;
  /** ISO 8601 UTC representation of authTime; NOT the time this library ran. */
  readonly mfaVerifiedAt: string;
  readonly returnTo: string;
}

export interface AssurancePolicy {
  readonly passkeyUv?: {
    readonly acrValues: readonly string[];
    /** Two distinct issuer-defined event markers; neither means mere enrollment. */
    readonly methodAmr: string;
    readonly userVerificationAmr: string;
  };
  readonly passwordOtp?: {
    readonly acrValues: readonly string[];
    // This profile always requires BOTH the literal, case-sensitive 'pwd' and 'otp'.
  };
}

/** Construct only from trusted server configuration. Never from request headers or claims. */
export interface OidcClientConfig {
  readonly issuer: string;
  readonly discoveryUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post';
  /** A single server-selected URI, checked against the exact allowlist below. */
  readonly redirectUri: string;
  readonly allowedRedirectUris: readonly string[];
  /** Defaults to the issuer origin. Optional additions are explicit server trust decisions. */
  readonly endpointOrigins?: readonly string[];
  readonly idTokenAlgorithms: readonly SigningAlgorithm[];
  readonly additionalTrustedAudiences?: readonly string[];
  /** At least 32 CSPRNG bytes. Dedicated secret, not a password or client/session secret. */
  readonly flowCookieSecret: Uint8Array;
  readonly assurance: AssurancePolicy;
  /** Authentication freshness, independent of the application's authorization/session policy. */
  readonly maxAuthenticationAgeSeconds: number;
  readonly flowTtlSeconds?: number;
  readonly maxIdTokenLifetimeSeconds?: number;
  readonly requestTimeoutMs?: number;
  /** Explicit opt-in, HTTP literal loopback only, forbidden when NODE_ENV=production. */
  readonly allowInsecureLocalhost?: boolean;
}

export interface CookieResponse {
  /** Append one complete Set-Cookie value; do not overwrite existing session cookies. */
  appendSetCookie(value: string): void;
}

export interface BeginAuthorizationRequest {
  readonly method: string;
  /** Pass req.query.next directly: arrays/objects/coercions are deliberately rejected. */
  readonly returnTo?: unknown;
}

export interface AuthorizationCallback {
  readonly method: string;
  /** Unmodified origin-form req.url; never build an absolute URL using Host/Forwarded. */
  readonly rawUrl: string;
}

export interface AuthorizationStart {
  readonly authorizationUrl: string;
  readonly state: string;
}

export interface VerificationContext {
  /** Trusted expectation from the authenticated flow, not the ID token itself. */
  readonly nonce: string;
  readonly returnTo: string;
}

/** Atomic insert-if-absent until expiresAt (Unix seconds), shared across ALL app instances. */
export type ConsumeFlow = (
  key: string,
  expiresAt: number,
  signal: AbortSignal,
) => Promise<boolean>;

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface BridgeDependencies {
  readonly fetch?: Fetch;
  /** Trusted resolver for the configured issuer only; NEVER derive from incoming JWT headers. */
  readonly jwks?: JWTVerifyGetKey;
  /** Mandatory replay gate. No unsafe in-process production default is provided. */
  readonly consumeFlow: ConsumeFlow;
  /** Milliseconds since epoch. Test seam; omit in production. */
  readonly now?: () => number;
}

export interface IdentityBridge {
  beginAuthorization(request: BeginAuthorizationRequest, cookies: CookieResponse): Promise<AuthorizationStart>;
  completeAuthorization(callback: AuthorizationCallback, flowCookie: string | undefined, cookies: CookieResponse): Promise<Identity>;
  /** Low-level primitive. Does not validate state, consume a flow, or authenticate a browser. */
  verifyIdentityToken(token: string, context: VerificationContext): Promise<Identity>;
  flowCookieName(state: unknown): string;
  readFlowCookie(cookieHeader: string | undefined, state: unknown): string | undefined;
}

# Identity Bridge

Server-only, provider-neutral OpenID Connect authorization-code client for a **Next.js Pages Router, Node 24** application. ESM TypeScript, `jose` **6.2.12**, no Next.js runtime dependency. The Better Auth service is the prospective issuer; this package does not implement that service or assume its current plugins already satisfy this contract.

**Bounded batch:** additions under `identity-bridge/` only. No application replacement, Cognito cutover, deployment, GitHub write, email, production request, account export, principal provisioning, email-based account linking, role assignment, or authorization-policy change.

**Handoff status:** the 60 dependency-free utility tests passed in the available **Node 22.16.0** sandbox after syntax-only transpilation with globally installed TypeScript **5.8.3**. The full jose-backed tests, requested Node 24 execution, pinned TypeScript typecheck, and package installation **have not run**. Registry access failed with `EAI_AGAIN`; installation was not retried. Read [VALIDATION.md](VALIDATION.md) before integration. This is a reviewable implementation batch, not production-cutover approval.

## Repository context and boundary

Read against `Mirror-Progress/mirror-progress-platform`, requested branch `codex/mirror-identity-migration`, pinned commit **`4e883e79f1e11070806b9e5c24ecbbd303a959a5`**:

- [`docs/identity-migration/IMPLEMENTATION.md`](https://github.com/Mirror-Progress/mirror-progress-platform/blob/4e883e79f1e11070806b9e5c24ecbbd303a959a5/docs/identity-migration/IMPLEMENTATION.md).
- [`docs/identity-migration/reference/client/lib/state-kernel/authorization/cognito.ts.txt`](https://github.com/Mirror-Progress/mirror-progress-platform/blob/4e883e79f1e11070806b9e5c24ecbbd303a959a5/docs/identity-migration/reference/client/lib/state-kernel/authorization/cognito.ts.txt). The root-relative `reference/...` path returned 404; this is the actual path resolved from the pinned tree.

The reference uses signed flow cookies, PKCE and issuer/audience/nonce verification, but returns callback time as `mfaVerifiedAt`. This library deliberately does **not** preserve that behavior or its permissive URL/cookie handling. It also does not preserve legacy flow-cookie fallback, refresh-token return, automatic retry redirects, or Host-based redirect selection.

The integration continuation remains application-owned: explicitly map **issuer + subject** to the existing principal, preserve invited-membership activation and active-policy checks, then create the existing digest-only opaque application session. The migration contract's eight-hour absolute / one-hour idle session limits, per-request authorization-epoch checks, and five-minute privileged step-up gate are **not implemented or modified here**. An `/admin` return path confers no privilege. The existing administrator passkey requirement must remain enforced by the app, using `identity.assurance.kind`, not return-path classification.

## Install and validate locally

From `identity-bridge/`, using Node 24:

```sh
node --version
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
# Review the lockfile changes and require registry-backed integrity for every package.
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

The supplied npm v3 lockfile is **offline-authored**, with exact versions and tarball URLs, not an npm-installed or integrity-verified lockfile. It has **no fabricated integrity hashes**. Its four-package graph (jose, TypeScript, Node types, undici-types) passes npm Arborist's offline structural check, but registry resolution and the Node-types transitive dependency must be reconciled locally. If npm leaves missing integrity fields unchanged, regenerate the lockfile locally, review the resulting exact graph, and repeat `npm ci`. Do not treat this initial lock as a supply-chain approval.

`npm run typecheck` checks source and tests. `npm run build` emits `dist/` plus declarations. `npm test` compiles tests into `.test-dist/` and uses Node's built-in test runner. No test performs a real HTTP request: provider responses are injected, keys are generated locally, and identifiers/secrets are synthetic. Never reuse test secrets. `dist/`, `.test-dist/`, dependencies and real environment files are not included in the batch.

## Public API

```ts
import {
  createIdentityBridge,
  IdentityBridgeError,
  pagesCookieResponse,
  safeReturnTo,
} from '@mirror-progress/identity-bridge';
import type {
  Identity,
  IdentityBridge,
  OidcClientConfig,
  BridgeDependencies,
  ConsumeFlow,
} from '@mirror-progress/identity-bridge';

const bridge: IdentityBridge = createIdentityBridge(serverConfig, {
  consumeFlow, // Required durable, atomic app-owned adapter. Contract below.
  // fetch: trustedFetch, // Optional; defaults to Node's fetch.
  // jwks: issuerKeys,   // Optional jose JWTVerifyGetKey; this configured issuer ONLY.
  // now: () => Date.now(), // Optional millisecond clock; test seam, normally omit.
});

const { authorizationUrl, state } = await bridge.beginAuthorization(
  { method: 'GET', returnTo: '/workspace' }, cookieResponse,
);

const flowCookie = bridge.readFlowCookie(rawCookieHeader, incomingState);
const identity = await bridge.completeAuthorization(
  { method: 'GET', rawUrl: rawOriginFormCallbackUrl }, flowCookie, cookieResponse,
);

// Low-level verification primitive, NOT a browser authentication endpoint:
const separatelyVerified = await bridge.verifyIdentityToken(idToken, {
  nonce: trustedExpectedNonce,
  returnTo: trustedReturnPath,
});
```

Network/JWKS dependencies are injected **once at construction**, not selected by callback input. `CookieResponse` has one synchronous method, `appendSetCookie(value: string): void`. Both start and complete return promises. No method reads environment variables except the safety check forbidding the local HTTP opt-in when `NODE_ENV=production`.

`completeAuthorization` validates the unmodified origin-form callback URL and the signed cookie, consumes the flow atomically, exchanges the code once with confidential authentication, verifies the signed identity token, and returns `Identity`. It clears only that state-scoped cookie after the callback is sufficiently well formed to identify its state, including on subsequent errors. It never creates an app session or returns access/refresh tokens.

`verifyIdentityToken` is intentionally a lower-level cryptographic/claims primitive. It does **not** validate browser state, find a cookie, consume a flow or prevent replay. Its nonce expectation must come from a trusted transaction, never from decoding the token being verified. Do not expose it as a token-to-app-session endpoint.

### Verified `Identity` shape

All fields are readonly; the returned object, `amr` array and `assurance` object are frozen. Only these fields are returned:

| Field | Type and exact meaning |
| --- | --- |
| `issuer` | `string`; exact server-configured and signature-validated `iss`. |
| `subject` | `string`; signed, nonempty, case-sensitive ASCII `sub`, at most 255 characters. Never replaced with email. |
| `email` | `string \| null`; exact signed address, basic syntax/length checked, not normalized. Absent means `null`. |
| `emailVerified` | `boolean`; signed boolean `email_verified`, absent means `false`. String/number coercion is rejected; `true` without email is rejected. |
| `authTime` | `number`; positive integer **Unix seconds** from signed `auth_time`, representing the accepted ceremony. |
| `amr` | `readonly string[]`; signed, nonempty, unique, bounded method values; case-sensitive. |
| `assurance` | `{ readonly kind: 'passkey-uv' \| 'pwd-otp'; readonly acr: string }`; exact configured issuer context plus required AMR evidence. |
| `mfaVerifiedAt` | `string`; UTC ISO 8601 representation of **that same signed `auth_time`**. Never callback, issue, registration, refresh or local-clock time. |
| `returnTo` | `string`; validated local path from the authenticated flow, not callback query or token claims. |

This value establishes authentication evidence, not account identity mapping or authorization. Email is informational; identical emails under different subjects remain distinct identities. Provider roles, groups, principal IDs, names, token contents and arbitrary custom claims are not forwarded.

## Fixed server configuration

Every URL, client credential, signing algorithm, assurance rule and callback URI is server-owned. Never construct configuration from `Host`, `Forwarded`, `X-Forwarded-*`, user email, query parameters, JWT headers or JWT payloads.

An illustrative configuration (the test URNs are **not** a production service contract):

```ts
import { createIdentityBridge } from '@mirror-progress/identity-bridge';
import type { ConsumeFlow, OidcClientConfig } from '@mirror-progress/identity-bridge';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function makeServerConfig(): OidcClientConfig {
  const hex = required('IDENTITY_FLOW_SECRET_HEX');
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error('Invalid flow-secret encoding');
  const callback = required('IDENTITY_CALLBACK_URI');
  return {
    issuer: required('IDENTITY_ISSUER'),
    discoveryUrl: required('IDENTITY_DISCOVERY_URL'),
    clientId: required('IDENTITY_CLIENT_ID'),
    clientSecret: required('IDENTITY_CLIENT_SECRET'),
    tokenEndpointAuthMethod: 'client_secret_basic',
    redirectUri: callback,           // One fixed URI for this app instance/surface.
    allowedRedirectUris: [callback], // Exact values, no wildcard or Host lookup.
    idTokenAlgorithms: ['ES256'],    // Reconcile with the actual issuer registration.
    flowCookieSecret: Buffer.from(hex, 'hex'),
    maxAuthenticationAgeSeconds: 3600, // Example auth freshness, NOT step-up policy.
    assurance: {
      passkeyUv: {
        acrValues: [required('IDENTITY_PASSKEY_UV_ACR')],
        methodAmr: required('IDENTITY_PASSKEY_ASSERTION_AMR'),
        userVerificationAmr: required('IDENTITY_USER_VERIFICATION_AMR'),
      },
      passwordOtp: { acrValues: [required('IDENTITY_PASSWORD_OTP_ACR')] },
    },
  };
}

// App-owned adapter must be supplied, not replaced with `async () => true`.
export function configuredBridge(consumeFlow: ConsumeFlow) {
  return createIdentityBridge(makeServerConfig(), { consumeFlow });
}
```

Generate a dedicated random flow key using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` locally into approved secret storage, never into source control. The key must be **32–64 random bytes**. The library rejects short and trivially repetitive byte arrays but cannot measure entropy; a long password is not a random key. Client secret is a separate server-side secret, at least 32 UTF-8 bytes. No `NEXT_PUBLIC_*` variables, browser imports, token logging, secret fallback, public-client mode, or secret key reuse.

| Setting | Default / constraints |
| --- | --- |
| `issuer`, `discoveryUrl` | Required fixed URLs. Issuer matching is byte-exact, including a trailing slash. No WebFinger, tenant-selected discovery or issuer guessing. |
| `endpointOrigins` | Issuer origin always trusted; optional extra **exact origins** explicitly extend that trust. Discovery and all discovered authorization/token/JWKS endpoints must remain within this set. |
| `redirectUri`, `allowedRedirectUris` | Required exact, canonical URLs, no query/fragment/credentials; callback path cannot be `/`. The selected URI cannot change per request. |
| `idTokenAlgorithms` | Required nonempty subset of `RS256`, `PS256`, `ES256`, `EdDSA`. No HS algorithms or `none`. Discovery must advertise the configured choices. |
| `additionalTrustedAudiences` | Empty by default. Extra audiences require explicit server allowlisting; every audience must be trusted. Multi-audience tokens require `azp === clientId`; a present `azp` must always match. |
| `maxAuthenticationAgeSeconds` | Required integer 1–86,400. Checked against signed `auth_time` and sent as `max_age`. |
| `flowTtlSeconds` | 600; integer 60–600. Cookie timestamps must match this exact configured lifetime. |
| `maxIdTokenLifetimeSeconds` | 300; integer 30–600. Maximum `exp - iat`, not a session lifetime. |
| `requestTimeoutMs` | 5,000; integer 50–15,000. Bounds each network operation / resolver / replay-store call, including non-cooperative injected promises. |
| `allowInsecureLocalhost` | `false`. Explicit dev-only HTTP exception for literal `localhost`, `127.0.0.1`, `[::1]`; any port, no aliases/subdomains/other loopback addresses. Forbidden when `NODE_ENV=production`. |

HTTPS is otherwise mandatory. URL-parser rewrites, percent escaping, backslashes, userinfo, whitespace, query/fragment additions and unexpected origins are rejected. Explicit cross-origin provider endpoints are supported only through `endpointOrigins`; that list is an outbound trust decision, not a CORS setting. Use network egress controls appropriate to the deployment as well.

## Provider service contract — must be reconciled before integration

**Do not weaken these checks to make an issuer that omits assurance claims appear compatible.** The client cannot independently inspect a WebAuthn ceremony or a TOTP check performed by the provider. Cryptographic verification proves which configured issuer attested to the claims; their ceremony meaning remains a provider implementation and security-review obligation.

The issuer must expose fixed HTTPS OIDC discovery, authorization, token and JWKS endpoints; advertise authorization-code flow, S256, the configured asymmetric ID-token algorithm and the configured confidential client authentication method; accept exact registered redirect URIs and a PKCE verifier; and consume authorization codes atomically once. The client asks for `openid email`, `response_mode=query`, `max_age`, `acr_values` and essential `amr`, `acr`, `auth_time` ID-token claims. These requests are not themselves evidence and do not force the issuer to comply: the returned evidence is checked independently.

This bounded profile additionally **requires RFC 9207**: discovery must contain `authorization_response_iss_parameter_supported: true`, and success/error callback queries must carry the exact issuer in `iss`. This requirement is deliberate; an issuer that does not yet support it is not compatible with this batch. There is no mix-up-protection downgrade switch.

ID tokens must contain signed `iss`, `aud`, `sub`, `nonce`, `iat`, `exp`, `amr`, `acr` and `auth_time`. A nonempty `kid` is required. `typ` may be absent, `JWT` or `application/jwt`; `at+jwt`, header-supplied `jku`/`jwk`/`x5u`/`x5c`, critical extensions and unencoded-payload modes are rejected. Tokens must use the nonce associated with the code and return only the properly bound client's ID token. Do not issue an access token with indistinguishable ID-token purpose/audience/claims. Optional hash claims are not used because access tokens are never consumed by this library.

Exactly one configured authentication profile must match:

| Profile | Required attestation, not enrollment state |
| --- | --- |
| `passkey-uv` | An exact issuer-defined ACR from `passkeyUv.acrValues`, **both distinct configured AMR event markers**, and `auth_time`. The issuer must mean a successfully verified WebAuthn **authentication assertion with User Verification actually required and verified**. The UV marker must not mean user presence, an authenticator's UV capability, a registered passkey, or merely a requested UV preference. |
| `pwd-otp` | An exact issuer-defined ACR from `passwordOtp.acrValues`, literal case-sensitive **`pwd` and `otp`** in AMR, and `auth_time`. The issuer must mean both password authentication and successful OTP verification in the attested authentication context. For this migration, the agreed OTP must be TOTP; the string `otp` alone cannot identify an implementation's OTP transport. Recovery/email/SMS/remembered-device shortcuts must not be mislabeled as this context. |

`auth_time` must identify the **accepted MFA authentication ceremony**, conservatively recording the original ceremony time when reusing an existing MFA-authenticated SSO context. It must not become token minting time, callback time, registration time, session refresh time, or time of the last password-only check. It must not be newer than `iat` or the verifier's current time. Future timestamps are rejected with **zero clock tolerance**; operate synchronized clocks. A later real step-up may update the attestation only when the provider has actually verified the required stronger ceremony.

The ACR lists for the two profiles must be disjoint. No default ACR values or implicit interpretations of `acr=0`, `mfa=true`, `twoFactorEnabled`, authenticator registration, generic `amr=["mfa"]` or `amr=["pwd"]` are trusted. Password-only and registration-only tokens fail even if email is verified. The test fixture values `webauthn`, `uv` and `urn:example:test:*` are **synthetic examples**, not claims about Better Auth's current output. Do not reinterpret generic marker names without verified provider semantics.

A passkey token may contain other AMR entries, but both configured event markers and its accepted ACR must be present. Unknown extra AMR entries convey no extra privilege. Neither accepted profile asserts hardware binding, device attestation, phishing resistance of every surrounding workflow, independent administrator enrollment, or a NIST assurance-level certification.

## State, PKCE, cookie and replay semantics

Each authorization uses independently generated **32-byte state**, **32-byte nonce**, and **48-byte PKCE verifier**; the S256 challenge alone goes into the authorization URL. Each browser flow has a separate cookie named `__Host-mp_oidc_flow_<full-state>` over HTTPS. Cookies are host-only (`Path=/`, no Domain), HttpOnly, Secure, SameSite=Lax, with a maximum ten-minute lifetime. Explicit local HTTP development uses the distinct `mp_oidc_dev_flow_` prefix and omits Secure; never deploy that mode.

The versioned cookie is HMAC-SHA256 authenticated with a dedicated secret, purpose-separated and bound to issuer, client ID, exact redirect URI, full state and payload. Parsing rejects noncanonical base64url, bad MACs, extra segments, duplicate JSON fields, extra/missing fields, noncanonical JSON serialization, invalid numeric dates and unsafe stored return paths. MAC checks use constant-time comparison. The cookie is **signed, not encrypted**: it contains nonce, PKCE verifier, path and flow metadata, not identity/access/refresh tokens. Treat it as sensitive in diagnostics, proxies and application middleware.

The request cookie parser rejects duplicate occurrences of the selected name, quoted/escaped cookie values, malformed selected cookies, control characters and oversized headers. It never falls back to a legacy shared cookie. Parallel tabs keep separate flows. Cookie clearing is hygiene, **not** a server-side single-use guarantee.

### Required atomic `consumeFlow` adapter

```ts
export type ConsumeFlow = (
  key: string,         // purpose-prefixed SHA-256 digest; not a raw state/code/token
  expiresAt: number,   // absolute integer Unix seconds
  signal: AbortSignal,
) => Promise<boolean>;
```

The app must supply a shared durable store implementing **insert-if-absent** for this key until `expiresAt`, across every process, app revision and instance that accepts this configured flow. Return `true` exactly once; `false` for a previously consumed flow. Check-and-set in separate operations is not sufficient. A SQL unique insert or a correctly configured shared store's atomic NX operation can implement the contract; select durability, failover and expiry behavior explicitly. Store TTL must not be rounded down or allowed to evict a live consumption marker. Reject expired requests rather than creating an already-expired marker. Honor cancellation where possible. Never return `true` on a storage error.

The bridge invokes this adapter **after authenticated-cookie validation but before token exchange**, and before honoring a provider denial. Timeouts, non-boolean results and exceptions fail closed. After consumption, any failure—including provider outage, bad token or user denial—requires a **new authorization flow**. There is no automatic code-exchange retry or replay-store rollback. A late adapter operation after timeout may still burn the flow, but cannot return an identity. The in-memory Set in tests is explicitly not a deployment adapter.

## Pages Router adapter boundary

`pagesCookieResponse(res)` works structurally with `NextApiResponse`, appends rather than overwrites `Set-Cookie`, and sets `Cache-Control: no-store`, `Pragma: no-cache`, and `Referrer-Policy: no-referrer`. Import this package only in server-only configuration and Pages API routes, not shared browser components, Edge middleware, or browser bundles. The package exposes a Node export condition and imports Node crypto; it is not an Edge-compatible client.

The relevant handler fragments are:

```ts
// /api/auth/start — illustrative only; no app route is included or changed by this batch.
const cookies = pagesCookieResponse(res);
const start = await bridge.beginAuthorization(
  { method: req.method ?? '', returnTo: req.query.next }, cookies,
);
res.redirect(302, start.authorizationUrl);

// /api/auth/callback — select cookie from request state; full parsing happens inside complete.
const callbackCookies = pagesCookieResponse(res);
const flowCookie = bridge.readFlowCookie(req.headers.cookie, req.query.state);
const identity = await bridge.completeAuthorization(
  { method: req.method ?? '', rawUrl: req.url ?? '' }, flowCookie, callbackCookies,
);
// Continue through the existing principal/membership/policy/session pipeline.
// Do not create/link a principal by email or redirect as though login succeeded before that pipeline.
```

Use the original `req.url` with duplicate query fields still present. Do not reconstruct a callback URL from parsed query fields, which would lose duplicate detection, and do not concatenate a Host header into it. Deployment routing must preserve the configured callback path; proxy rewriting, locale/base-path behavior and percent decoding need explicit integration tests. The selected callback **URI** is fixed by server configuration and the validated flow; raw callback requests must match its path. A forwarded host is never an authority.

In handlers, catch `IdentityBridgeError` and return a generic non-cacheable sign-in failure; classify only its static `code` for carefully scoped metrics. Do not return the thrown object, stack or provider-supplied descriptions. Unexpected handler/application errors must also produce a generic failure. Error codes are listed in `src/errors.ts`; dependency errors are sanitized without `cause`. The library has no logger, and access/refresh tokens are discarded, not exposed through its API. That does not redact the surrounding app: explicitly redact authorization headers, code query strings, Cookie/Set-Cookie, request bodies, tokens and PII from application/proxy/APM traces. Do not log full `Identity` values either.

## Return-path and transport limitations

`safeReturnTo(undefined)` selects `/workspace`; every invalid supplied value throws. Allowed paths are exact roots `/workspace`, `/admin`, `/apps/studioiq` and slash-delimited descendants. The intentionally conservative grammar allows only ASCII letters, digits, `/`, `_`, `-`, `.`, `~`, up to 512 characters, with no repeated slash or `.`/`..` segment. **All percent escapes, query strings, fragments, backslashes, controls, whitespace and Unicode are rejected**, even seemingly benign ones. This rules out double decoding, encoded delimiters, protocol-relative and normalization tricks without attempting to repair an unsafe target. Query-state navigation requires a separately designed app-owned mechanism; do not relax this helper by decoding repeatedly or trimming input.

Discovery is cached for five minutes with single-flight loading and no stale fallback after expiry. Remote JWKS uses jose's five-minute cache and 30-second refresh cooldown, plus bounded custom fetch. Key rotation must overlap sufficiently; an unknown key fails closed during cooldown. An injected resolver must provide the same trusted-issuer isolation and appropriate rotation semantics. This package does not actively invalidate already cached keys on an emergency revocation signal.

Every network request rejects redirects, omits ambient cookies, disables caching and referrer transmission. Responses require HTTP 200 and JSON media type (JWKS also permits `application/jwk-set+json`), bounded streaming bodies, valid UTF-8 and object JSON without duplicate names. Discovery/JWKS bodies are limited to 64 KiB, token responses to 32 KiB, ID tokens to 16 KiB and JWKS to 32 keys. Fixed per-operation deadlines limit asynchronous dependencies, not total CPU scheduling delay or whole-request time under process starvation. Production handlers must also have request/rate limits and lifecycle cancellation appropriate to the hosting stack. Rate-limit start/callback routes to avoid cookie accumulation and provider/key-fetch abuse; do not evict replay markers to relieve load.

Not implemented: provider enrollment/recovery, OIDC server or Better Auth storage, WebAuthn/TOTP ceremonies, email delivery, dynamic registration, untrusted multi-issuer federation, public clients, implicit/hybrid flows, JARM, `form_post`, PAR, request objects, UserInfo, access-token use, refresh-token persistence, application sessions, principal mapping, logout/global revocation, account linking, tenant policy, administrator enrollment, authorization epochs, audit storage, rate limiting or a durable replay adapter. These are boundaries, not claims that integration or security review has passed.

## Tests and primary API references

Tests cover locally signed tokens and a mocked confidential token endpoint, exact nonce/issuer/audience checks, missing/expired claims, algorithm/key failures, authenticated cookie schema attacks, wrong state, cookie expiry, PKCE code/verifier binding, concurrent replay, safe URLs, malformed callback queries, password/registration-only rejection, future/stale ceremony timestamps, MFA omission and dependency/network failures. The isolated utility suite covers pure parsing, cookies/configuration, URL attacks, adapter headers and bounded transport; see the exact execution distinction in [VALIDATION.md](VALIDATION.md).

Implementation references, not assertions of completed interoperability:

- [jose 6.2.12 package manifest](https://github.com/panva/jose/blob/v6.2.12/package.json), [jwtVerify](https://github.com/panva/jose/blob/v6.2.12/src/jwt/verify.ts), and [createRemoteJWKSet / customFetch](https://github.com/panva/jose/blob/v6.2.12/src/jwks/remote.ts). Used modern ESM/Web Crypto APIs; no legacy `KeyLike` imports or v5 fetch options.
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html): code flow, ID-token validation and authentication claims.
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636): S256 PKCE.
- [RFC 6749 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749#section-2.3.1): form-encode each Basic-auth credential before joining and Base64 encoding. `client_secret_post` is supported only when explicitly configured.
- [RFC 9207](https://www.rfc-editor.org/rfc/rfc9207): authorization response issuer identification.

Codex must reconcile the actual issuer discovery/claim/ceremony contract, durable replay adapter and existing local app baseline before integration. Do not modify the obsolete public `client/` as a shortcut.

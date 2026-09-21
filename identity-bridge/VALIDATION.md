# Validation evidence and unexecuted checks

## Scope and provenance

This batch adds only `identity-bridge/`, using the migration context pinned to
`4e883e79f1e11070806b9e5c24ecbbd303a959a5` in
`Mirror-Progress/mirror-progress-platform`. It does not contain, replace, or modify
the obsolete public application client. Source paths and verified upstream API
references are recorded in README.md. No external GitHub write, deployment,
production identity request, email, account access, or production data handling
was performed.

## Checks actually performed

| Check | Observed result |
| --- | --- |
| Syntax-only transpilation | All 17 source/test TypeScript files transpiled with global TypeScript 5.8.3; zero syntactic diagnostics. Not a semantic typecheck. |
| Isolated utility suite | 60 tests passed, 0 failed/skipped, using Node 22.16.0 on temporary transpiled files outside this package. No jose runtime dependency. |
| Offline lockfile graph | npm 10.9.2 Arborist `loadVirtual`, offline mode: 5 nodes including the root, 0 invalid dependency edges. No packages downloaded or integrity validated. |
| Partial TypeScript diagnostic attempt | Did not pass: absent jose module/type declarations and resulting implicit-any contextual-type diagnostics. Exact output included below; it is not a passed typecheck. |
| Artifact scope | ZIP and patch contain additions under `identity-bridge/` only, with no dependencies, generated build output, environment files or generated private keys. |

The utility suite directly exercises URL/return-path validation, configuration,
HMAC flow cookies, strict parsing and expiry, development HTTPS exceptions,
Pages Router cookie/header adaptation, bounded HTTP response handling and
asynchronous dependency deadlines. It does **not** exercise jose signature
verification, token exchange orchestration, discovery caching, or the complete
OIDC callback path.

Evidence files:

- `validation/offline-utilities.tap` — actual passing utility-suite output.
- `validation/partial-typecheck.txt` — actual diagnostic output from the available
  TypeScript compiler with available global Node types, without jose installed.

The utility run used `transpileModule` to produce temporary ESM JavaScript,
then `node --test --test-reporter=tap` on `utilities.test.js`. This avoids claiming
that unsupported versions or missing dependencies satisfied the requested toolchain.
Those temporary files are not packaged.

## Not executed / not established

**npm registry access failed with `EAI_AGAIN` for `registry.npmjs.org`. No npm
installation retry was made.** The sandbox has Node 22.16.0, not the requested
Node 24 runtime. The following remain unexecuted:

- Install or `npm ci` against the shipped package/lock, registry integrity
  verification, and reconciliation of the offline-authored transitive graph.
- Full source/test semantic typecheck with pinned TypeScript 5.9.3,
  `@types/node` 24.0.0, and jose 6.2.12.
- The library build with the pinned dependencies/toolchain.
- `authorization.test.ts`, `dependencies.test.ts`, and `identity-token.test.ts`,
  including locally signed JWTs, mocked confidential token exchange, PKCE,
  issuer/audience/nonce attacks, MFA omission and signed ceremony timestamps,
  algorithm variants, remote JWKS and replay/concurrency/dependency failures.
- Any Next.js/browser integration, real provider interoperability, provider
  ceremony implementation review, replay-store durability/failover testing,
  independent security review, or production release gate.

jose's versioned upstream APIs were checked for `jwtVerify`, `JWTVerifyGetKey`,
`createRemoteJWKSet` and the symbol-keyed `customFetch` option. The implementation
uses ESM/Web Crypto APIs and does not substitute a fake jose implementation or
claim synthetic crypto tests were executed.

## Lockfile limitation

`package-lock.json` is an **offline-authored npm v3 exact-version graph**. It
includes resolved npm tarball URLs but no integrity fields because registry
metadata was unavailable. No integrity values were invented. Its graph is
structurally loadable, but that does not verify package publication, tarball
contents, transitive registry metadata or installation reproducibility.

On a registry-connected Node 24 environment, refresh/reconcile the lock,
require real integrity metadata for every resolved package, review the resulting
graph, then run `npm ci --ignore-scripts` and `npm run check`. See README.md for
commands and the fallback if npm retains missing integrity fields. This is a
local integration task, not work claimed to have occurred in this sandbox.

## Integration gates made explicit

The provider must attest **actual** passkey authentication with verified UV or
password plus verified OTP, with the agreed issuer-defined ACR and original
ceremony `auth_time`. Current Better Auth plugin compatibility is **not asserted**.
This client additionally requires RFC 9207 response issuer identification.
Do not weaken checks or stamp callback time to compensate for missing evidence.

The app must provide a durable, atomic, shared `consumeFlow` implementation and
preserve its existing issuer+subject mapping, principal/membership/policy checks,
opaque sessions, administrator passkey rules and privileged step-up checks. The
test in-memory Set is not a production replay adapter. No automatic email account
linking, provisioning, authorization policy, session policy or account state is
implemented or changed by this batch.

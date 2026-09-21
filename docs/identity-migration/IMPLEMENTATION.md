# Mirror Identity implementation contract

Status: implementation branch only; not approved for production cutover.

## Source boundary

This branch starts at the public repository main commit dc1240d. That commit is
NOT the deployed application baseline. Current application changes exist in the
operator's local checkout and require separate release reconciliation. Build the
new identity service independently; do not replace production client code using
this branch's older client directory. Never publish local datasets, account
exports, environment files, logs, deployment secrets or tokens.

## Selected design

- Dedicated TypeScript Better Auth service in identity/, PostgreSQL, custom UI.
- Production origin https://accounts.mirrorprogress.com; local port 3040.
- OIDC authorization code + S256 PKCE, exact redirect URIs, no dynamic client registration.
- Canonical existing Mirror principal ID survives migration. Identity subject maps
  explicitly to that ID; never merge by email or let users supply privileged roles.
- State Kernel remains authoritative for organization membership, roles and access.
- Ordinary user: verified migration email link followed by passkey or password + TOTP.
- Administrator: independently verified enrollment plus passkey. Email alone must
  never activate privileged access.
- No unrestricted public signup. Disabled principals stay disabled.
- Authentication assurance derives from verified ceremonies and their timestamps,
  never from a callback timestamp or merely having a registered authenticator.
- Each application keeps its host-only opaque session and authorization epoch
  checks. Recovery/global logout must invalidate downstream sessions as well.

## Security and delivery

Use the maintained Better Auth password, session, passkey, two-factor and OIDC
implementations. Pin versions, use server-owned policy, prevent credential/token
logging, and protect TOTP/recovery material. Tokens are short-lived, single-use,
and consumed atomically. Use distributed rate limiting and durable email delivery.
Document actual storage semantics; do not claim hashed/encrypted storage unless
implemented and tested. Runtime database access uses a least-privilege role.

ChatGPT implements bounded batches on branches and submits draft PRs against
codex/mirror-identity-migration. Codex reviews, tests and integrates. Do not merge
to main, deploy, send customer email, change repository permissions or handle
production data in a coding batch. CI uses synthetic data and no AWS credentials.

## Release gates

Typecheck/build/tests; OIDC, MFA, recovery and tenant-isolation integration tests;
browser validation; backup/restore and rollback rehearsal; account parity;
privileged enrollment; independent security review. Only after readiness passes,
perform hard cutover and email enrollment. Retain isolated Cognito resources seven
days for rollback, then retire operational dependencies. Historical audits remain.

## Existing application bridge contract

The current app is Next.js Pages Router. It verifies an issuer/audience/nonce,
resolves IdentityPrincipal, activates invited membership, checks active policy,
then creates a digest-only opaque application session. Preserve that authorization
sequence, replacing provider-specific lookup with issuer+subject mapping.
Planned entrypoints: /api/auth/start and /api/auth/callback. App return targets are
allowlisted local paths under /workspace, /admin and /apps/studioiq.

Existing session lifetime: eight hours absolute, one hour idle. Privileged
mutations require verified step-up within five minutes. Session credentials and
principal authorizationEpoch are checked on every protected request.

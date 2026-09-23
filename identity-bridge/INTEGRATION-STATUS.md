# Integration status

September 22 update: locally corrected the exact Mirror v1 signed ceremony
profile and canonical decimal epoch handling. Typecheck/build/233 tests pass.
A real service/PostgreSQL password-TOTP code/PKCE flow now completes through this
bridge and callback replay is rejected. See
../docs/identity-migration/ENROLLMENT-INTEGRATION.md. Application integration,
recovery, downstream invalidation and release review remain open. The historical
provider compatibility blocker below is resolved for the explicit Mirror profile.

2026-09-21: isolated implementation candidate, NOT connected to the application.

Source received from ChatGPT's `Write OIDC Identity Bridge` conversation as
`identity-bridge.zip` (27 files), SHA-256
`aee898bb5ebf419d6a4668564ed0fcd02a265df651b7998c9b224c74823f108c`.

Codex installed the actual pinned dependencies on Node 24.19.0. Typechecking,
declaration build and all 206 tests passed. The offline lock was independently
regenerated against the npm registry in a fresh directory to obtain integrity
hashes. This supersedes the original artifact's offline-only validation limits;
its original VALIDATION.md remains provenance, not current deployment evidence.

## Blocking integration review

- The library requires issuer-defined standard ACR/AMR MFA claims, which the
  selected Better Auth 1.7.5 provider does not support. Reconcile using reviewed,
  session-bound evidence; never interpret ACR 0 as MFA. See
  ../docs/identity-migration/PROVIDER-CONTRACT-REVIEW.md.
- A real durable, atomic consumeFlow adapter is still required; test fixtures
  are not suitable for multiple production instances.
- No principal mapping, application session creation, global revocation,
  recovery integration or privileged enrollment is implemented by this package.
- Review OIDC hash-claim handling and provider interoperability before release.
- Provider-backed integration, browser tests and independent review remain open.

CI is synthetic and read-only outside its checkout. It cannot deploy, access AWS,
send customer email or change accounts. Passing this package's tests is not
production migration approval.

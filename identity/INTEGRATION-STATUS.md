# Identity service integration candidate

Verified locally 2026-09-22. This is NOT production-ready and is not connected to
the live application. Synthetic-only startup guards deliberately remain enabled.

## Provenance

ChatGPT recovered source archive `mirror-identity-recovered.zip`, SHA-256
`2c8c466851a31982852e0e69503bc484faa7569ed30578f74e3100f2bcb8caa2`.
Recovery records, account exports, generated credentials and build outputs are
not included. The npm lockfile was resolved from the registry, not reconstructed.

Codex integration repairs:

- Removed unsupported OAuthProviderExtension `id` property.
- Forwarded only the server-owned transport peer to the library rate limiter.
  Incoming internal/proxy address assertions cannot override that peer.
- Preserved HTTP 429 instead of disguising throttling as bad credentials.
- Added actual PostgreSQL regression coverage for spoofing/client isolation.

## Verified checks

Node 24.19.0, pinned Better Auth 1.7.5, local isolated PostgreSQL 17:

- TypeScript build and browser bundle pass.
- 77 unit tests pass, zero skipped.
- Schema creation and repeated migration pass.
- 17 real database/library integration tests pass, zero skipped.
- Production npm dependency audit reports zero vulnerabilities.

An initial integration run found shared `no-trusted-ip` throttling. A repeated
test run also exposed the local harness incorrectly changing the encryption
secret for an existing database; the harness now retains its test-only secret.
Encryption was not disabled. Historical synthetic database state was preserved
separately. Neither fix touches production credentials.

## Still required before cutover

- Production configuration, verified-email invitations, privileged enrollment,
  usable recovery, email changes/session management and delivery tracking.
- Reconcile bridge assurance profile (the current epoch claim is a decimal
  string from PostgreSQL bigint), OIDC client authentication and discovery.
- Connect immutable principal mapping and application sessions; deliver and
  verify cross-application revocation.
- Real browser/passkey tests, staging deployment, backup/restore and rollback
  rehearsal, independent security review and human administrator enrollment.
- AWS access refresh and resolution of SES external-delivery restriction.

GitHub Actions was billing-blocked at the prior check. Local tests are not a
claim that CI, staging, browser authentication or cutover has passed.

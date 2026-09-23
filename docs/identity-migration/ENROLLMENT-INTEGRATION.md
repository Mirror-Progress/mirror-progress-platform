# Enrollment and provider integration — September 22, 2026

Production remains unchanged. This checkpoint is a locally verified candidate,
not a cutover or independent security approval.

## Source receipt

The correct `mirror-identity-recovered(1).zip` (no space) is 56,742 bytes, SHA-256
`18b35963e70e77b0bdbf1a5c3a8b9b5bb1b1df24c91cc364d17cc20925be6a68`.
All 31 entries are beneath identity/; traversal/symlink checks and all internal
SHA-256 checks passed. Its 28 source files were overlaid after diff review. The
existing lock, migration 001, integration tests, runtime-owned IP handling and
provider extension fix were retained. Recovery metadata was not executed or
imported as implementation. The recovered historical test claim was not relied on.

## Actual local verification

Node 24.19.0, registry-resolved existing pinned locks, actual installed libraries:

- Identity full TypeScript/browser build and 131 unit tests passed.
- Two repeat synthetic migration applications and 18 real PostgreSQL service
  tests passed, including real password/TOTP → authorization code/PKCE → corrected
  bridge → signed-token verification, plus rejection of callback replay.
- Seven additional real PostgreSQL enrollment tests passed: least-privilege
  startup; denied runtime policy/invitation mutation; concurrent encrypted mailbox
  request deduplication; retry acceptance; single-winner enrollment; disabled,
  changed-epoch and wrong-token rejection; collision rollback; secure password
  session; and independent operator approval without granting password-only access.
- Bridge typecheck, declaration build and 233 tests passed.

The enrollment tests use the dedicated loopback database
`mirror_identity_enrollment_test` on the preexisting synthetic PostgreSQL container
at 127.0.0.1:55432. They create synthetic operator logins and use an injected fake
transport; they neither send email nor demonstrate real privileged passkey UV.
The injected local test pool uses local PostgreSQL transport, not staging TLS.
Production/staging runtime configuration still requires certificate verification.

## Corrected signed contract

The service emits `https://mirrorprogress.com/assurance` with exact fields
`version: 1`, `session_id`, `method`, `verified_at`, `password_verified_at` and
`expires_at`, resolved from the actual library session and durable ceremony record.
The existing principal and authorization epoch are separately signed under
`https://mirrorprogress.com/principal_id` and
`https://mirrorprogress.com/authorization_epoch`. Epochs stay canonical decimal
strings in PostgreSQL bigint range; values beyond JavaScript safe integers are
tested without rounding.

The bridge's explicit `assurance: { mirrorV1: true }` profile verifies these fields,
timestamps and supported factor methods. It never interprets ACR 0 as MFA or uses
callback time as evidence. It supports the provider's public code/PKCE client,
omits unsupported request claims, and validates supplied at_hash/c_hash/s_hash
against transaction inputs. Standard sid, when present, must match session_id.
The application must still compare signed identity with its authoritative
issuer/subject mapping and authorization state; signed principal claims alone
must not create roles, memberships or accounts.

## Reproduction and limits

Run bridge `npm ci --ignore-scripts`, then `npm run check`. Run identity
`npm ci --ignore-scripts`, `npm run build`, `npm test`, then its existing synthetic
migration/integration commands with generated local-only credentials.
The provider interoperability test requires the sibling bridge build first.
For enrollment, provision the named empty local test database and run
`node --test --test-concurrency=1 dist/test/staging/enrollment.test.js` with
`ENROLLMENT_TEST_DATABASE_URL` set to its loopback owner URL. The suite refuses
other host/port/database values. Never use production credentials or data.

Remaining: application routing/mapping and downstream invalidation; real delivery
and recovery; full session UI; browser passkey validation; infrastructure and
staging rehearsal; production account parity; human privileged enrollment;
independent security review; current AWS credentials; tested cutover/rollback.
GitHub Actions and ChatGPT artifact receipt are no longer gates. Corrupt bridge
transfer was not repaired or applied; the correction above was implemented locally.

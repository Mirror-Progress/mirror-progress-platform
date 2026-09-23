# Production candidate — September 23

Production remains on revision43/Cognito. The corrected identity image is now
published and deployed to the isolated staging identity service as revision2.
Production resources and routing are unchanged.

## Explicit environment separation

The production profile fixes origin/RP to accounts.mirrorprogress.com, client ID to
mirror-production and callback to https://platform.mirrorprogress.com/api/auth/callback.
The existing live application's PLATFORM_BASE_URL was verified read-only as
https://platform.mirrorprogress.com. Its historical Cognito callback uses the canary
host and is preserved for rollback; it is not reused as the new provider callback.

Production runtime, owner, operator roles and database use the distinct
mirror_identity_production namespace. Exact profile checks reject staging host,
RP, callback, runtime role and database, and encoded/cross-environment operator
role names. Verified database TLS, secure cookies, mandatory online-status secret,
mailbox verification, independent approval and fresh UV/MFA all remain enforced.
The runtime also rejects owner JSON credentials outside the bootstrap path.

Separate production startup, migration, operator and recovery executables reuse
the established policy. Migrations001–003 are unchanged and retain their historical
mirror_staging table/function names **inside the separate production database**.
The names do not select a weaker policy. Staging entrypoints continue rejecting
production configuration. No real mappings or operator accounts are imported.

Separate CDK production constructs create distinct state/secrets/roles and an exact
identity hostname. The production service can only synthesize DesiredCount=0 in
this preparation; starting it remains a reviewed release change after migration.
The application integration grants only scoped flow/status secrets and image pull.
It changes no existing app service, DNS, listener rule or Cognito resource.
`identity-infra/src/synth-production.ts` is an offline compiler requiring an explicit
inventory JSON and immutable digest. No real production inventory or deployment
was inferred from staging network resources.

## Callback defect found and fixed locally

The combined provider/app test originally failed with identity_binding_unavailable.
Better Auth1.7.5 intentionally omits scope-derived email fields from code-flow ID
tokens. The app correctly requires verified email and therefore refused the token.
The first-party customIdTokenClaims hook now supplies email and email_verified from
the database user only when email scope is granted. An unverified user remains
false; no scope means neither claim is included. Provider-owned standard security
claims are unchanged. The existing namespaced assurance extension still checks
actual mailbox/MFA/approval evidence before issuance.

The corrected staging identity image is
`sha256:dcac3d887942400a607260e820e9099332259ebaf14ea5765121e5bdfabafca1`.
Its ECR scan completed with zero critical, two high, one medium and one low finding;
the existing bounded applicability review still applies and is not an independent
security approval. The CloudFormation update changed only service task definitions
and the identity service, without replacement of the database.

## Reproducible evidence

Use Node24. Build identity and identity-infra first. Local tests create only synthetic
data and never send mail or contact a production authentication endpoint.

- `npm test --prefix identity`: 150 unit tests, including profile isolation, strict
  production TLS/status configuration and scoped verified-email claims.
- `npm run check --prefix identity-infra`: seven synthesis tests, including all
  production stacks together, stopped service, separate resources and unchanged
  existing application routing. Original staging synthesis tests still pass.
- `node identity/scripts/test-hosted-enrollment.mjs`: ten staging and ten production
  checks, zero skipped, with Chromium virtual passkeys and real local PostgreSQL.
  Requires the existing loopback PostgreSQL55432 and MongoDB55433 test containers,
  the baseline-bound private app candidate and installed Chromium. The runner
  validates PostgreSQL binding, verifies the overlay, and forces browser tests on.
- Production browser flow also invokes the **actual application start/callback**,
  actual provider issuance/signature/PKCE and actual MongoDB mapping/session code.
  Only the HTTP bridge transport is routed in-process and restricted to the local
  handler; it cannot fall through to production. Explicit principal/membership/
  roles and both authorization versions survive; replay, disabled membership and
  actual provider revocation deny access. This is not an AWS callback test or
  evidence of a human performing the privileged ceremony.
- Build `mirror-identity:local-production-candidate` from identity/. Its image build
  runs the service unit suite. `test-container-production.mjs` runs the compiled
  production migration twice against disposable TLS PostgreSQL, starts the
  non-root/read-only runtime, checks ALB/health isolation and absence of runtime
  schema/recovery-approval privileges, then destroys its own test resources.
- That runner performs an actual local dump/restore to a separate disposable DB.
  It preserves a synthetic disabled privileged principal ID, epoch9007199254740993
  and all migration checksums. This is not an RDS snapshot restore or real-account
  recovery acceptance test.
- `IDENTITY_TEST_IMAGE=mirror-identity:local-production-candidate node identity/scripts/test-container-staging.mjs`
  checks the same new image still supports the staging executable and restrictions.

Real delivery/enrollment, independent review, unresolved image findings and verified
production inventory/secret provisioning remain. See AWS-REHEARSAL.md for deployed
callback and point-in-time restore evidence; keep synthetic proof separate from
human enrollment.

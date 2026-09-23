# Verified-release application integration candidate

These files were implemented and tested against the deployed application archive
in `../BASELINE.md`, not the obsolete root client. The .txt suffix prevents them
from entering that old checkout's build. The manifest records original and final
hashes. `node apply-overlay.mjs` verifies the overlay; `--apply` writes only to the
ignored migration-worktree `identity-release/client` sandbox. Other targets,
symlinks and baseline conflicts are rejected. No deployment is performed.

## Authentication and authorization

The candidate now includes `/api/auth/start` and `/api/auth/callback`, gated by
`AUTH_IDENTITY_PROVIDER=mirror`. A reviewed issuer/subject mapping must match the
signed principal; email never links accounts. Existing State Kernel principal,
membership and policy checks still apply. Host-only opaque sessions carry an
Identity binding and contain no provider bearer token. Every protected session
resolution checks the mapping and current Identity session over authenticated
HTTPS. Revocation, outage, kernel epoch changes, disabled mappings/memberships
and policy changes fail closed. Privileged membership requires a fresh passkey
at login plus the service's independent privileged approval gate.

Mirror mode rejects old-provider callbacks and legacy session fallback. Rollback
mode rejects Mirror sessions and requires fresh Cognito login. Neither switch
changes memberships or principal IDs.

The callback uses the durable MongoDB flow-consumption adapter: unique hashed
key, atomic majority insert, expiry validation, fail-closed errors and delayed
TTL cleanup. No raw browser state, authorization code or token is stored.

## Packaging and verification

Build identity-bridge, pack it into `identity-release/client/vendor`, and install
the tarball in that candidate. This avoids a symlink outside the Docker context.
The resulting lockfile stays with the private verified release. Dockerfiles pin
Node 24.21.0 / Debian 13 by image manifest digest. The public RDS CA bundle is SHA-256
`e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3`.

The application passes typechecking, a full Next build and 26 checks: 13 existing
authorization tests plus 13 real MongoDB checks (seven session/mapping and six
flow-consumption checks). Service responses are injected in the app tests; the
real status endpoint is separately checked with PostgreSQL/provider sessions.
Combined deployed HTTPS app/service rehearsal and DocumentDB validation remain.

Retained dependency updates: Next/eslint-config-next 15.5.26, nodemailer 9.1.1,
postcss 8.5.28 and sharp 0.35.4. The earlier candidate passed dependency audit and
image codec tests; see prior progress for scope. No private release datasets or
lockfiles are published with this overlay.

## Remaining release dependencies

Optional new-account provisioning, invitation sends and legacy MFA resets now
fail before any database or Cognito operation in Mirror mode. Existing-user MFA
recovery uses the separately tested operator workflow. Membership disabling still
revokes State Kernel access and sessions, while Mirror mode skips Cognito mutations.
Two guard tests pass; extending new-account self-service is deferred. Runtime mapping
writes must be restricted to reviewed operator imports. Live delivery, operator
enrollment, independent review, infrastructure/service readiness and tested
cutover/rollback remain. No live mapping import, email or cutover has occurred.

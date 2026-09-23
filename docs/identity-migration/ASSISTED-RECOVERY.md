# Assisted staging recovery

Implemented and locally tested; not operated on real users and not independently
approved for production. Public reset and mailbox-only recovery remain unavailable.

Two distinct registered database operator logins are required. The first operator
records independently checked identity evidence under a review reference and
requests recovery at an exact current authorization epoch. The CLI generates a
strong random password and hashes it with the pinned Better Auth implementation.
Only its hash enters the recovery database row. A new private file (exclusive
creation, mode 0600) contains the request ID and recovery password. The password
is never placed in a command argument, audit record, console output or email.

A different operator checks the evidence and approves within fifteen minutes.
For privileged users, that approver must also differ from the original invitation
issuer and reconciler. SQL derives each actor from the authenticated database
login; callers cannot supply or impersonate the actor. Disabled principals,
changed epochs, expired requests, already-consumed requests and credential/binding
conflicts are rejected atomically. The runtime role cannot call recovery functions.

Approval replaces the credential password, removes old passkey/TOTP credentials,
revokes sessions, advances the exact bigint epoch and records the existing security
outbox event. The consumed request's password hash is cleared. Principal identity,
email and memberships are preserved; no account is enabled, session created or MFA
asserted. The app's online session-status check makes old Identity-bound sessions
unusable without waiting for event delivery. Privileged access requires another
independent approval at the new epoch and a later verified passkey authentication.

The CLI is `dist/scripts/staging-recovery.js` with:

- `request <principal> <decimal-epoch> <review-reference> <new-private-output-file>`
- `approve <request-id> <independent-review-reference>`

It requires `IDENTITY_MODE=staging` and a fresh operator URL in
`IDENTITY_OPERATOR_DATABASE_URL`, uses verified database TLS and never sends mail.
The private file must be handed to the verified user through an approved secure
channel and then retired. The password does not automatically expire after the
approval window; that window limits the pending request. Automated delivery,
self-service credential change, operational recovery rehearsal and independent
review remain release dependencies.

Actual local tests prove a single winner among four concurrent approval attempts,
rejection of requester self-approval and runtime approval, immediate old-session
revocation, exact epoch advancement past JavaScript's safe integer range, preserved
principal binding, password-only access after recovery, and unchanged credentials
when disabled/changed-epoch approval fails. The browser test separately verifies
privileged passkey registration/approval/authentication. No real human enrollment
or production recovery is claimed.

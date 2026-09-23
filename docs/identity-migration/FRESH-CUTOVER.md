# Fresh Mirror Identity cutover — 23 September 2026

The production application now routes sign-in to Mirror Identity at
`https://accounts.mirrorprogress.com/api/auth`. The application service runs
task revision 47 with two healthy tasks. The old Cognito callback returns 404;
the account service and OIDC discovery respond over trusted HTTPS.

This is a fresh install. No Cognito account, credential, subject, or account
history was imported into Mirror Identity. Existing State Kernel records remain
untouched, including the old seeded principals; they do not authenticate through
the new provider. A new first-owner principal and `super_admin` membership were
created for the owner-supplied `ronniemack@mirrorprogress.com`, with an exact
new issuer/subject mapping. The owner completed mailbox verification,
password creation, and a device passkey sign-in. No mail was sent by the
deployment; the owner requested the verification message in the setup page.

The production Identity database is separate from staging, encrypted, private,
Multi-AZ, and initialized by the one-off schema task. The runtime is a private
Fargate service behind a TLS application load balancer. Production SES delivery
is scoped to the verified `mirrorprogress.com` sender and recipient domain.
The SES account remains in sandbox; that verified domain supports the first
owner's setup, while delivery to other domains requires SES production access.

The first-owner bootstrap task exited zero and reported one new owner, zero
legacy imports, and no email sent. Its temporary IAM roles and task definitions
were removed after completion. The bootstrap script and infrastructure changes
are in this PR. The one-time invitation is held in a production Secrets Manager
secret. Its invitation was consumed during enrollment; do not commit it to
this repository.

The protected Cognito rollback image remains in the immutable rollback ECR
repository. Application task revision 45 was prepared with that exact digest for
an operational rollback if the new sign-in fails. This rollback path is separate
from the fresh-account setup and does not imply a historical-account migration.

Validation: 152 Identity unit tests, 11 staging and 11 production hosted
enrollment tests, 7 infrastructure synthesis tests, and a production container
TLS/schema/startup smoke check passed. The production service and application
health, sign-in redirect, discovery, and old callback behavior were checked
after cutover. The owner subsequently completed the human mailbox and passkey
ceremonies and opened an authenticated platform session.

Earlier documents in this directory describe staging rehearsals and an
abandoned account-migration proposal. Their statements that production remains
on Cognito or that legacy-account reconciliation is a cutover gate were
superseded by this user-authorized fresh-install decision.

## First-owner sign-in correction

The first owner verified the mailbox, created credentials, and established a
password session, but did not register a passkey or complete privileged sign-in.
The first passkey registration window expired after five minutes and reported
`privileged_passkey_required`, which left the old five-card page with an
unhelpful error. The production page now presents password and passkey as two
actions. After password sign-in it starts passkey creation when needed, then
fresh passkey authentication, and opens the application only after the Identity
session reports completed MFA. A stale setup session returns
`fresh_password_required` with a clear instruction to sign in again. The first
passkey enrollment window is fifteen minutes for a fresh production account.

The correction passed 152 unit tests and 12 staging plus 12 production hosted
enrollment checks, including a Chromium virtual passkey flow, the application
callback, and a stale-password regression. These are synthetic checks; they do
not establish that the owner's device passkey ceremony has succeeded.

## First-owner landing route

The owner completed the device sign-in, then reached a 404 at `/apps/studioiq`.
The session itself was valid: `/admin` and `/admin/studioiq-pilots` rendered in
the same browser. The landing chain sent the administrator to `/workspace`,
whose client-only guard selected a Studio IQ product route even though the
administrator did not have a client workspace. The fresh sign-in default now
starts the application at `/admin`. The application routes administrators who
open `/workspace` to `/admin`; client accounts retain their client routes.

## Canonical internal Prospect access

The owner clarified that Studio IQ is now called Prospect and that Mirror
Progress's canonical internal accounts should open the Prospect product
without another account system. A read-only production check found two active
internal super-admin principals: the prior founder record had an active
Prospect organization, owner membership, and entitlement; the new Mirror
Identity principal had an active canonical membership and identity mapping
but no Prospect access. A bounded transaction attached the new principal to
that same Prospect organization with an owner membership and audit record. It
created no second organization or new entitlement.

The platform now provisions the same tenant-bound Prospect access when a
future active internal super-admin, admin, or project lead signs in with a
reviewed Mirror Identity mapping. It verifies the canonical principal and
membership, existing internal Prospect organization, and active entitlement;
it never revives disabled access. Client accounts remain limited to their own
explicit organization access. The Prospect page opens the product for an
internal member with access and retains the pilot-admin fallback when access
cannot be established.

The owner access transaction passed a read-only preflight (one eligible new
principal, one existing workspace, active entitlement, available seat) and
committed one access record, one membership, and one audit record. The platform
runtime image `sha256:1566b4955d35a5a9975ca7b639595ef4fca553bc2da760bb45aad100292cf3a5`
is running as task revision 47 with two healthy tasks. The production build,
12 focused authorization/Prospect checks, and baseline-bound overlay integrity
check passed. In the owner's signed-in browser,
`https://platform.mirrorprogress.com/apps/studioiq` rendered **Prospect |
Project discovery** with the owner account menu; no second authentication
prompt appeared.

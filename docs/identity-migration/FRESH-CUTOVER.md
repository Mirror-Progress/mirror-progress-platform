# Fresh Mirror Identity cutover — 23 September 2026

The production application now routes sign-in to Mirror Identity at
`https://accounts.mirrorprogress.com/api/auth`. The application service runs
task revision 44 with two healthy tasks. The old Cognito callback returns 404;
the account service and OIDC discovery respond over trusted HTTPS.

This is a fresh install. No Cognito account, credential, subject, or account
history was imported into Mirror Identity. Existing State Kernel records remain
untouched, including the old seeded principals; they do not authenticate through
the new provider. A new first-owner principal and `super_admin` membership were
created for the owner-supplied `ronniemack@mirrorprogress.com`, with an exact
new issuer/subject mapping. The owner must finish mailbox verification and
passkey registration using the one-time setup link delivered separately. No
mail was sent by the deployment; the user triggers the verification message in
the setup page.

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
secret until the owner completes enrollment; do not commit it to this repository.

The protected Cognito rollback image remains in the immutable rollback ECR
repository. Application task revision 45 was prepared with that exact digest for
an operational rollback if the new sign-in fails. This rollback path is separate
from the fresh-account setup and does not imply a historical-account migration.

Validation: 152 Identity unit tests, 11 staging and 11 production hosted
enrollment tests, 7 infrastructure synthesis tests, and a production container
TLS/schema/startup smoke check passed. The production service and application
health, sign-in redirect, discovery, and old callback behavior were checked
after cutover. Human mailbox and passkey ceremonies remain to be completed by
the owner in a browser.

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
open `/workspace` to `/admin`, and administrators who open `/apps/studioiq` to
`/admin/studioiq-pilots`; client accounts retain their client routes.

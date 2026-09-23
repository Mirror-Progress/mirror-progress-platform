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

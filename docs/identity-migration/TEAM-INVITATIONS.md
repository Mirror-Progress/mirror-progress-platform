# Mirror Progress account invitations

## Intended experience

An authenticated Mirror Progress owner opens **Admin → Invitations**, enters a
person's name and email, chooses **Mirror Progress admin** or **External
Prospect account**, and chooses the company. Sending creates one pending
invitation and emails one branded, single-use setup link. The recipient opens
the link, chooses a password, registers a passkey, and lands in Prospect.
They never enter an operator token, request a second verification email, or
create a second Prospect account.

The admin can see pending, accepted, expired, failed-delivery, and revoked
states. Resend rotates the link; revoke invalidates it. Account type, company,
and role are chosen by the authenticated owner, never by the recipient or a
query parameter. External accounts are scoped to the selected company;
internal admins join the Mirror Progress tenant. A current role and tenant
decision must be checked again when a session is created.

## Implementation and release status

The candidate implementation adds a Mirror Identity owner-only invitation
screen, seven-day single-use links, a branded SES message, one-email mailbox
proof, automatic password/passkey continuation, status, resend, and revoke.
The signed Identity session and managed invitation evidence let the platform
create the matching State Kernel principal, membership, and issuer/subject
mapping at first sign-in. Internal admins join the canonical internal
workspace; external users join an existing company Prospect workspace with
an active entitlement and available seat. The existing client-portal
invitation screen remains a separate legacy flow.

Deployed on 23 September 2026: platform task revision 48, additive Identity
database migration 004, and Identity service task revision 6. Both services
reached a completed rollout with their desired instance counts healthy. The
live Identity page returns HTTP 200 and shows the invitation screen; its admin
endpoint rejects unauthenticated requests. No invitation to the four named
people has been created or sent.

## Implemented controls

1. Add a narrow, audited invitation issuer authenticated by the owner's fresh
   passkey-backed session. Create a unique principal ID and persist name,
   normalized email, account type, company, role, expiry, and inviter. Reserve
   the same ID in Identity. The State Kernel principal, membership, and
   issuer/subject mapping are created atomically at the first authenticated
   Prospect callback, using the signed managed invitation evidence.
2. Send the invitation from the verified Mirror Progress sender through a
   durable outbox. Store only the token digest in durable account tables and
   keep the sealed delivery payload short-lived. The email link itself is the
   mailbox possession proof; a recipient does not request another email.
3. Accept the one-time link only for its exact email/principal/epoch and before
   expiry. Enrollment creates credentials but does not silently grant access.
   Fresh password and passkey authentication complete the account; the
   platform's canonical membership grants Prospect access in the chosen
   workspace.
4. Add an admin list and resend/revoke controls, with idempotent retry,
   explicit delivery failure, and audit records. Cover unauthenticated and
   cross-tenant denial, duplicate email, expired/revoked link, and the full
   synthetic recipient journey before production deployment.

SES currently accepts recipients only in verified domains for this account.
On 23 September 2026 its production-access status was still false, its prior
review was denied (case 178460481200014), and an updated account-details
request returned `ConflictException`. The candidate checks that live status
before issuing an external-domain invitation and shows the limitation in the
admin screen; it never reports an unsupported delivery as sent. External
delivery requires AWS to grant production sending access or a separately
configured transactional sender. No invitation to the four named people
should be issued until their exact emails, account types, and companies are
selected in the admin form.

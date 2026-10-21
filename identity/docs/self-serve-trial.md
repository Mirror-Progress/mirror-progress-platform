# Self-serve Prospect trials

Prospect sends a public trial request to Identity at `POST /internal/identity/self-serve-trial-invitations` after it has validated and provisioned the request. Identity creates an external client invitation recorded against the never-bound `mirror-self-serve-trial` principal and queues one invitation email. The response is only a coarse status: `queued` (with `principalId`), `resent`, `pending` or `exists`. Prospect never receives a token or link.

## Request

- Header `Authorization: Bearer <IDENTITY_SELF_SERVE_SECRET>`, no `Origin` header, `Content-Type: application/json`.
- Body: `name`, `email`, `company`, and optional integer `trialDays` (1–365). `trialDays` is stored on the invitation (`mirror_managed_invitation.trial_days`) and used in the email copy. When it is absent the copy says 14 days. Prospect still owns and enforces the actual trial term.
- The account type (external), role (client), inviter and link are never caller-controlled.

## Limits

1. The shared per-IP limiter (`ip:<address>`, 60 per minute) runs before authentication.
2. After authentication, a service-wide limit of 60 per hour applies before the body is parsed.
3. A per-domain limit of 10 per day applies before the mail-provider check.
4. Inside the database, migration 008 caps issuance at 200 per day overall and 5 per domain per day. It also allows at most one resend per 15 minutes and three per day for each invitation.

Kill switch: `UPDATE mirror_principal SET disabled=true WHERE id='mirror-self-serve-trial';`

## Sign-in for external client accounts

An external client account can finish setup and sign in with its password alone. It qualifies when it is non-privileged, enrolled, and holds an unrevoked `external`/`client` managed invitation on the production fresh install. After the account is created, the browser signs the person in and continues straight to Prospect, with no passkey step. A passkey can still be added later ("Set up another device"), and passkey sign-in stays available. The OIDC assurance method for these sessions is `password`. The identity bridge maps it to kind `pwd`.

Admin, project-lead and other privileged accounts still require a passkey. Migration 008 enforces this on `mirror_assurance` with a check constraint and a trigger, so the runtime role cannot record password-only evidence for anyone else.

## Configuration

| Variable | Purpose |
| --- | --- |
| `IDENTITY_SELF_SERVE_SECRET` | Bearer secret for this endpoint only. It must be 48–256 characters and must differ from `BETTER_AUTH_SECRET`, `IDENTITY_DELIVERY_KEY` and `IDENTITY_SESSION_STATUS_SECRET`. If unset, the route returns 404. |
| `IDENTITY_SESSION_STATUS_SECRET` | Unchanged. It is used for session-status, managed-profile and Identity's calls to Prospect. It is not accepted by the self-serve route. |
| `IDENTITY_PLATFORM_ORIGIN` | Optional on hosted profiles. If set, it must equal the origin of the pinned redirect. It is required (as a loopback origin) for the local preview. |
| `IDENTITY_MAIL_DELIVERY` | `graph` (sends from `hello@mirrorprogress.com`), `ses` (fallback; sends from `identity@mirrorprogress.com` to match the task role's `ses:FromAddress` condition), or `local-file` (local preview only). |

The production service stack does not yet inject `IDENTITY_SELF_SERVE_SECRET`. Until a secret is added to the foundation and the task definition, the route stays unavailable (404). Prospect must send the same value in place of the session-status secret.

## Migrations

Staging, production and the local preview apply the same ordered, checksummed set: `001`–`009`. Production already has `001`–`008`; the unit test `migration-order` pins their checksums, so `009-revoke-releases-email` is the only new migration there. 008 does not redefine any 007 function. 009 redefines only `mirror_managed_revoke` (see below) and adds no tables, columns or grants.

## Revoking a person

An invitation admin revokes a person from the admin Invitations list (`POST /api/identity/admin/invitations/:principalId/revoke`, fresh passkey required). The SQL function `mirror_managed_revoke` (004, replaced by 009) does all of this in one transaction:

- marks the managed invitation revoked, disables the principal and advances its authorization epoch;
- consumes the pending invitation link and cancels any queued or failed invitation email;
- deletes the bound user's sessions, password flows and pending password-reset links (Better Auth `verification` rows `reset-password:*` whose value is the user id);
- **releases the email**: the bound Better Auth user's email becomes `revoked-<userId>@revoked.invalid` (RFC 2606 `.invalid`, never routable, unique per user, at most 254 characters). `emailVerified` is left unchanged. The original address stays on the managed invitation, enrollment and audit history, so the list still shows who was revoked;
- writes the `invite_revoke` outbox row and the `managed-revoke` audit row, as before.

Because the address is released, the same email can be invited again straight away, by an admin or through self-serve. Previously, `mirror_managed_issue` refused it ("That email already has an invitation") and operators renamed the user by hand.

009 also backfills people revoked before it: each user bound to a disabled principal whose managed invitation is revoked gets the same `revoked-<userId>@revoked.invalid` address, unless the email already ends in `.invalid` (for example an earlier hand rename such as `revoked-<name>-<userId>@mirrorprogress.invalid`, which is left as it is). Leftover sessions, password flows and reset links of disabled principals' users are deleted. Running the backfill again changes nothing.

Privileges: none new. The function stays `SECURITY DEFINER` with `search_path = public, pg_temp`; `CREATE OR REPLACE` keeps its owner and the runtime role's existing `EXECUTE`. `PUBLIC` has no `EXECUTE`.

The admin list labels a row **Revoked** before **Accepted** before the pending states (Expired, Sent, Delivery failed, Sending). Revoked and accepted rows have no Resend button.

### Platform notification

After a successful revoke, Identity tells Prospect so it can close its own principal, membership and access records without waiting for a session-status check:

```
POST {IDENTITY_PLATFORM_ORIGIN or https://platform.mirrorprogress.com}/api/internal/identity/principal-revoked
authorization: Bearer <IDENTITY_SESSION_STATUS_SECRET>
content-type: application/json

{"principalId": "<revoked principal id>", "reason": "identity_revoked"}
```

- Same secret, `redirect: "error"`, `cache: "no-store"` and a 5-second timeout as Identity's other calls to Prospect (`legacy-pilots`, `prepare-trial`, `company-check`).
- Best effort: the request is sent after the revoke has committed and is not awaited, so it never delays or fails the revoke. There is no retry; Prospect's per-request session-status checks still catch a missed notice.
- `200`, `202` and `404` (principal unknown to Prospect) count as done. Prospect should treat repeats as idempotent.
- Identity logs one JSON line without personal data: `{"event":"identity_platform_revoke_notify","status":<HTTP status | "failed" | "unconfigured">}` (`console.info` when done, `console.error` otherwise). `unconfigured` means the session-status secret is missing and nothing was sent.

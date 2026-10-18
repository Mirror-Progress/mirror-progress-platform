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

Staging, production and the local preview apply the same ordered, checksummed set: `001`–`008`. Production already has `001`–`007` (007, `unified-prospect-invitations`, shipped with the current live build), so `008-self-serve-trial-invitations` is the only new migration there. 008 does not redefine any 007 function.

# Mirror Identity release parity — 2026-10-18

Branch `feature/identity-self-serve-trial`, compared with:

- **Live**: production image `mirror-identity-production@sha256:ae4e3834…`. The comparison used the extracted `/app` files: `dist/`, `public/`, `migrations/` and `package.json`.
- **Main**: `origin/main` at `4f45cd5`.
- **Owner tree**: the uncommitted working tree in `mirror-identity-migration` (base `c080c8f`). It was copied to `/tmp` and built there; the tree itself was not modified.

## Method

Each tree was built with its own `npm run build` from the same `package-lock.json`. The compiled files were then compared with the live image file by file:

- `dist/src/**/*.js` and `dist/scripts/*.js`
- `public/*.js`, `public/*.html` and `style.css`, with esbuild's path-only comment lines ignored
- `public/brand/` and `public/fonts/`
- `migrations/*.sql`

Routes (including regex routes), SQL function calls, env reads and the runner migration lists come from those diffs.

**Result:** the live build is `origin/main` plus three things:

1. migration `007-unified-prospect-invitations`, which is in `migrate-production` only; the live `migrate-staging` still lists 001–006;
2. the legacy-pilot and trial-manager code in `src/app.ts`;
3. the matching code in `src/browser/production.ts`.

Every other live file is byte-identical to main's build: `auth`, `store`, `config`, the mail transports, `server`, the scripts, HTML and CSS. The owner tree has moved on since the image was built. It now carries its own versions of 008, self-serve and local preview, which are not in the live image.

## 1. Live-only features (in production, not on main): now on the branch

| Live feature | Where | On branch |
|---|---|---|
| Migration 007: trial managers may resend pending **external** invitations from any inviter; general invitations and revocation stay admin-only | `migrations/007-…sql`, `migrate-production` list | Yes. Byte-identical (sha256 `0dba9bd3…`), its own commit `9b0f32a` before 008 |
| Legacy pilot list: `GET {platform}/api/internal/identity/legacy-pilots` (bearer status secret, 5 s timeout, `studioiq_pilot_<uuid>` ids), merged and de-duplicated by email+company into the admin and trial-manager lists, with a `legacyUnavailable` flag | `app.ts` `legacyPilots`, `invitationsWithLegacy` | Yes (`89290bb`) |
| Trial-manager GET lists **all** external invitations, not only the caller's own (needed to resend) | `GET /api/identity/admin/trial-invitations` | Yes |
| Trial POST is refused with `legacy_pilot_exists` (409) when the email has a pending legacy pilot, and with `trial_preparation_failed` when the legacy list is unreachable | `POST /api/identity/admin/trial-invitations` | Yes |
| Legacy migration route: `POST /api/identity/admin/legacy-pilots/(studioiq_pilot_<uuid>)/migrate`. Requires a trial manager with a fresh passkey and an empty body, and refuses conflicts. It issues an external/client invitation | regex route | Yes |
| `canManageTrials` resend: on `/api/identity/admin/invitations/<id>/(resend\|revoke)`, a trial manager may **resend** an unrevoked external invitation. Revoke stays admin-only | regex route | Yes |
| Browser: "Pending · previous system" badge, a "Send new invite" button (legacy migrate), a resend button for trial managers without revoke, the `legacy_pilot_exists` copy, and the notice that older invitations could not be loaded | `browser/production.ts` → `public/production-app.js` | Yes |

The browser bundle has no remaining differences from live except the new trial additions.

The compiled `app.js` differs from live only in:

- the new self-serve route;
- password-only sign-in;
- comments;
- Prospect calls built from `platformOrigin(config)` instead of a hard-coded URL. In production that resolves to the same `https://platform.mirrorprogress.com`, taken from the pinned redirect.

Every other live line the branch changes is an intentional trial change, listed in section 3.

**Nothing live is missing from the branch.**

## 2. Main-only features (new in this release vs live)

None at runtime. Main's ten newer identity commits are already live, because the image was built from a tree that contained them:

- password reset
- Graph/hello@ mail delivery
- the Jahlon trial sender (006)
- the sign-in layout redesign
- the expired sign-in fix
- the "invitation setup first" account view
- hardened routes

The only things on main that are not in the image are operator files, which the Dockerfile does not copy: `scripts/INVITES.md`, `scripts/invite-people.mjs` and `scripts/invite-task.mjs`. Main also has one unit test (fresh-production password reset settings). These ship with the branch.

## 3. Self-serve trial features (new)

- `POST /internal/identity/self-serve-trial-invitations`. Service-to-service only: bearer `IDENTITY_SELF_SERVE_SECRET`, no `Origin` header, and the per-IP, service and per-domain limits run first. The body accepts `name`, `email`, `company` and an optional `trialDays` (1–365). Every invitation is external/client, and its inviter is the never-bound principal `mirror-self-serve-trial`.
- Migration 008:
  - the `mirror_self_serve_issue` and `mirror_self_serve_resend` functions, with DB ceilings of 200 a day overall and 5 a day per domain, at most one resend per 15 minutes and three a day, and a kill switch;
  - `trial_days` on invitations;
  - the `password` assurance factor, with a trigger that limits it to bound, enrolled, non-privileged external clients.
- Password-only sign-in for external client accounts, with passkey optional. The browser offers an "Add a passkey / Skip" step. Admins and project leads still need a passkey.
- Bridge: a new assurance kind `pwd` (`identity-bridge`), so the platform can accept password-only sessions for client roles only.
- SES fallback sender changed to `identity@` to match the task-role `ses:FromAddress` condition. Graph (the production setting) still sends from `hello@`.
- Self-serve email copy that shows the trial length.
- Local preview: `IDENTITY_LOCAL_PREVIEW=1`, `IDENTITY_MAIL_DELIVERY=local-file`. It refuses to run when `NODE_ENV=production`, which the image sets.

## 4. Environment

The live task definition matches `identity-infra/src/production-service.ts`; `identity-infra` is unchanged on this branch. I checked this by running `productionContainerEnvironment` and `loadConfig` from the branch build on the live env shape with synthetic values:

| Variable | Status |
|---|---|
| `IDENTITY_SELF_SERVE_SECRET` | **Not provided by the live task definition.** It is optional: when unset, the self-serve route returns 404 and startup succeeds. To enable self-serve, add it to the foundation as a secret and to the task definition. It must be 48–256 characters and differ from `BETTER_AUTH_SECRET`, `IDENTITY_SESSION_STATUS_SECRET` and the derived delivery key; otherwise startup fails with `separate_self_serve_secret_required`. Prospect must send the same value. |
| `IDENTITY_PLATFORM_ORIGIN` | Not provided, and not needed: it is derived from the pinned redirect. If set, it must equal `https://platform.mirrorprogress.com`, otherwise startup fails with `staging_allowlist_mismatch`. |
| `IDENTITY_LOCAL_PREVIEW`, `IDENTITY_LOCAL_PREVIEW_OUTBOX`, `IDENTITY_MAIL_DELIVERY=local-file` | Local only. With the image's `NODE_ENV=production`, `local-file` produces no transport, and `server.ts` refuses to start with `invalid_delivery_configuration`. Do not set them in a hosted environment. |
| `IDENTITY_MAIL_FROM=hello@mirrorprogress.com` | Read only by the operator script `issue-remote-enrollment`, which requires `identity@` and SES. Nothing at service startup reads or validates it, and startup with the live value passes. This is unchanged from live: the script is identical. |
| All other live variables | Read the same way as in the live build. No variable is newly required, and none the live task definition sets is rejected. |

## 5. Migration plan

- Every runner applies `001`–`008` in order, with checksums: `migrate-production`, `migrate-staging`, the local preview and the staging tests. The runner skips an applied migration whose checksum matches and stops on a mismatch.
- Files `001`–`007` are byte-identical to the live image. A unit test pins their SHA-256 values.
- **Production: only 008 is new.** 008 does not redefine any 004–007 function, so 007's `mirror_managed_resend` survives unchanged; the tests check its definition before and after. 008 re-creates the `mirror_assurance` factor check by name; it fails closed if the name differs.
- Before running the production migration, confirm read-only that `mirror_schema_migration` contains `007-unified-prospect-invitations` with checksum `0dba9bd3d120706a338e62260734f22ebe3a609c470a4be006b6c62f61cc8b66`. If 007 is absent, the runner applies it. That is safe: it is a single `CREATE OR REPLACE`, and existing grants are kept.

## 6. Verification (local only)

- `typecheck`, `build`: pass.
- `npm test`: 187/187.
- `npm run test:policy`: 187/187.
- Bridge `npm run check`: 235/235.
- Throwaway PostgreSQL 17.11 on a loopback port with a `/tmp` data directory, removed afterwards:
  - `staging/migration-order`, 4/4. It applies 001–007 as the live runner did and issues invitations, then runs the release path. Results: 001–007 are skipped with identical rows, only 008 is applied, a second run is a no-op, a forged checksum is refused, and after 008 a trial manager can resend external and self-serve invitations but not admin ones, and cannot revoke.
  - `staging/self-serve-invitation`: 7/7.
  - `staging/password-only-signin`: 3/3.
  - `staging/enrollment`: 12 pass and 1 skipped (the Chromium-gated test) in both the staging and production profiles.
- New unit tests: `unit/migration-order` and `unit/legacy-trial-manager`. The second fails against the branch as it was before this change, so it does catch the regression.

## 7. Risks

1. **Staging history.** The owner tree's `migrate-staging` lists 001–006 plus a *different* 008: no `trial_days`, no password factor. If that was ever applied to the staging database, the branch's staging runner will stop with `Applied checksum mismatch` on 008. Check staging's `mirror_schema_migration` read-only before migrating. Any local preview database built from an earlier 008 (for example on port 55440) must be recreated.
2. **Bridge before password-only users.** A Prospect platform still on the old bridge rejects `password` assurance with `assurance_insufficient`. External clients who skip the passkey could then not open Prospect. Deploy the platform with the `pwd`-aware bridge first, or with this release, and keep requiring `passkey-uv` for privileged roles in the platform.
3. **Self-serve is off until its secret exists.** Without `IDENTITY_SELF_SERVE_SECRET` in the foundation, the task definition and Prospect, public trial requests get 404. This is safe, but the feature is inactive.
4. **Behavior change vs main (not vs live).** The trial-manager GET now lists every external invitation, not only the caller's own. This matches production.
5. **Legacy dependency.** The admin and trial-manager lists, trial creation and legacy migration call Prospect's `legacy-pilots` endpoint. When it is down, trial creation fails closed (`trial_preparation_failed`) and the lists show `legacyUnavailable`. The self-serve route does not consult legacy pilots; Prospect validates public requests before calling.
6. **SES fallback.** If production ever falls back to `IDENTITY_MAIL_DELIVERY=ses`, the branch sends from `identity@`, matching IAM, where live sent from `hello@`. Under the current Graph configuration this has no effect.

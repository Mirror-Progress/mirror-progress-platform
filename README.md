# Mirror Progress Platform

Mirror Progress is currently implemented as a one-page Next.js site with two authenticated product layers inside the same application:

- Client Workspace
- Admin Dashboard

Detailed engineering notes: [docs/repository-review.md](docs/repository-review.md)

## Project Overview

The active product surface is `client/`, a Next.js Pages Router application. It serves:

- the single-page marketing homepage
- the contact flow
- account signup/login/logout
- the protected Client Workspace
- the protected internal Admin Dashboard

The repo also contains `backend/`, a separate FastAPI service that still exists in source control but is not part of the active homepage, workspace, or admin flow.

## Current Architecture

### Active architecture

- Next.js 15 with the legacy `pages/` router
- Tailwind CSS for styling
- GSAP for the homepage intro and motion-driven sections
- a semantic theme layer built with CSS variables and a React theme provider
- Next.js API routes for:
  - auth
  - admin mutations
  - contact email sending
  - Notion-backed work fetching

### Shared product data architecture

The current workspace and admin layers share the same lightweight file-backed model:

- account/auth store:
  - `client/lib/accounts.ts`
  - persisted locally to `client/data/accounts.local.json`
- platform/project store:
  - `client/lib/platform-store.ts`
  - persisted locally to `client/data/platform.local.json`
- workspace view tracking:
  - `client/lib/workspace-store.ts`
  - persisted locally to `client/data/workspace-views.local.json`
- shared entity types and workspace transformation:
  - `client/lib/workspace-data.ts`

This is intentionally a local/dev-oriented MVP architecture, not a production-grade data platform.

## Deployment Target

The current deployable app is the Next.js project in `client/`.

- Vercel project root: `client/`
- active backend runtime: Next.js pages and API routes
- FastAPI requirement for the current product: none

The separate `backend/` service remains in the repository, but it is not part of the active homepage, auth, workspace, admin, or password-reset flow.

## Repository Structure

```text
.
├── README.md
├── docs/
│   └── repository-review.md
├── client/
│   ├── components/
│   │   ├── admin/
│   │   └── workspace/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   │   ├── account/
│   │   ├── admin/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── sendMail.ts
│   │   │   └── work.ts
│   │   └── workspace/
│   ├── public/
│   │   └── workspace-assets/
│   ├── styles/
│   ├── .env.example
│   └── package.json
└── backend/
    ├── .env.example
    ├── app/
    └── requirements.txt
```

## Frontend

### Homepage

The homepage remains a single-page experience. The active sections are:

- `Hero`
- `Capabilities`
- `Form`
- `Footer`

### Themes

The active app now supports two themes:

- `dark`
- `light`

Current behavior:

- dark mode remains the default experience
- theme state is managed in `client/hooks/useTheme.tsx`
- the selected theme persists in `localStorage` under `mirror_progress_theme`
- a `beforeInteractive` script in `client/pages/_app.tsx` applies the saved theme early to reduce flash-of-wrong-theme

The light mode is intentionally designed rather than inverted. It uses a luminous visual system with:

- pearl and mist backgrounds
- cool blue and cyan atmospheric gradients
- teal accents
- deep cobalt anchor surfaces for panels, cards, and product UI

Primary theme files:

- `client/hooks/useTheme.tsx`
- `client/components/ThemeToggle.tsx`
- `client/styles/globals.css`

### Auth and account entry

- avatar entry point: `client/components/AccountMenu.tsx`
- login/signup modal: `client/components/AuthDialog.tsx`
- client auth/session state: `client/hooks/useAuth.tsx`
- session cookie signing: `client/lib/session.ts`

### Client Workspace

The Client Workspace lives at `/workspace` and is framed as a lightweight project record system.

Included in the current MVP:

- overview
- milestone timeline
- decisions
- open items
- files / links
- last updated
- last viewed

Client-visible content is filtered from the shared platform store. Internal-only project and milestone notes do not render in the client workspace.

### Admin Dashboard

The Admin Dashboard lives under `/admin` and acts as the internal control center for the workspace platform.

Current route structure:

- `/admin`
- `/admin/projects`
- `/admin/projects/[projectId]`
- `/admin/clients`
- `/admin/activity`

Current admin scope includes:

- operational summary dashboard
- projects directory with filters
- project detail editor
- milestone editing
- decision management
- action item management
- client access management
- activity log

## Role Model

The current role model is:

- `super_admin`
- `admin`
- `project_lead`
- `client`

Behavior:

- public signup creates `client` users only
- internal admin users are seeded locally
- admin pages are protected by role-aware server-side checks
- non-admin users are redirected away from admin routes

Protected deployment recommendation:

- disable public signup
- disable password reset unless you intentionally want the demo reset-link flow
- disable seeded dev accounts unless you intentionally need them for internal review

## How The Systems Currently Interact

### Active user-facing paths

- homepage UI is served by Next.js
- contact form submits to `client/pages/api/sendMail.ts`
- auth is handled by `client/pages/api/auth/*`
- admin mutations are handled by `client/pages/api/admin/mutate.ts`
- authenticated clients reach `/workspace`
- authenticated internal users reach `/admin`

### Separate backend path

The FastAPI service still exposes its own API, but the active frontend does not currently depend on it.

## Environment Variables

Example env files:

- `client/.env.example`
- `backend/.env.example`

### Frontend

```env
NEXT_PUBLIC_API_URL=
SESSION_SECRET=
AUTH_SESSION_SECRET=
APP_PROTECTED_MODE=false
APP_ACCESS_PASSWORD=
ALLOW_PUBLIC_SIGNUP=true
ALLOW_PASSWORD_RESET=true
DEMO_MODE_READ_ONLY=false
ALLOW_DEV_SEED_ACCOUNTS=true
```

Notes:

- `SESSION_SECRET` is the preferred session-cookie signing secret
- `AUTH_SESSION_SECRET` remains supported for backward compatibility
- `NEXT_PUBLIC_API_URL` is still present but is not used by the current homepage, workspace, or admin flow
- `APP_PROTECTED_MODE=true` enables the app-wide deployment gate
- `APP_ACCESS_PASSWORD` is required when protected mode is enabled
- `DEMO_MODE_READ_ONLY=true` makes JSON write endpoints fail explicitly instead of pretending a write succeeded

### Backend

```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
MONGODB_URI=
```

## Local Development

### Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`.

The following local data files are created automatically on demand:

```text
client/data/accounts.local.json
client/data/password-resets.local.json
client/data/platform.local.json
client/data/workspace-views.local.json
```

### Seeded local accounts

These local-only seed accounts are created automatically for development and are reconciled on account-store reads so they remain present even if an older `client/data/accounts.local.json` already exists:

- `admin@mirrorprogress.local` / `MirrorProgressAdmin123!`
- `lead@mirrorprogress.local` / `MirrorProgressLead123!`
- `sarah@horizonbiolabs.com` / `MirrorProgressClient123!`

Recommended Super Admin development login:

- Email: `admin@mirrorprogress.local`
- Password: `MirrorProgressAdmin123!`
- Role: `super_admin`

Seeding source:

- definitions live in `client/lib/accounts.ts`
- local accounts persist to `client/data/accounts.local.json`
- seeded credentials are the initial local defaults; if you later reset a password, the new password is preserved
- public signup still creates `client` users only
- admin route protection still relies on role checks, not email alone

These credentials are for local MVP development only. They are not production-safe credentials.

In protected deployments, seeded dev accounts are disabled by default unless `ALLOW_DEV_SEED_ACCOUNTS=true`.

### Password reset

The current forgot-password flow is a demo reset-link workflow.

- request page: `/account/forgot-password`
- reset page: `/account/reset-password?token=...`
- API routes: `client/pages/api/auth/forgot-password.ts` and `client/pages/api/auth/reset-password.ts`
- reset tokens persist locally to `client/data/password-resets.local.json`

How it works:

- the login flow links to `Forgot password?`
- submitting an email generates a time-limited reset token for that account if it exists
- instead of sending email, the app surfaces the reset link directly in the UI when reset is enabled
- opening that link lets you set a new password
- the stored password hash in `client/data/accounts.local.json` is updated

In protected deployments, password reset is disabled by default unless `ALLOW_PASSWORD_RESET=true`.

This is intentionally not production email infrastructure.

## Vercel Deployment

Use this app as a protected demo or limited beta, not as a production-grade JSON-backed system.

Recommended deployment steps:

1. Create a Vercel project with `client/` as the root directory.
2. Deploy only the Next.js app.
3. Set at minimum:
   - `SESSION_SECRET`
   - `APP_PROTECTED_MODE=true`
   - `APP_ACCESS_PASSWORD`
   - `ALLOW_PUBLIC_SIGNUP=false`
   - `ALLOW_PASSWORD_RESET=false`
   - `ALLOW_DEV_SEED_ACCOUNTS=false`
4. Optionally set:
   - `DEMO_MODE_READ_ONLY=true` if you want the deployment to be explicitly non-mutating

### Protected deployment mode

When protected mode is enabled:

- middleware redirects all non-static requests to `/access` until a deployment access cookie is set
- `/api/access` verifies the deployment password and sets a separate HTTP-only cookie
- after that access gate is passed, the normal account/session flow continues unchanged

This gate is meant to reduce casual public browsing and abuse for limited deployments. It is not a substitute for a real production security perimeter.

### JSON storage on Vercel

The app still reads and writes JSON files under `client/data/`, but Vercel does not turn those files into a durable multi-user database.

What the current refactor does:

- centralizes JSON file access
- serializes writes within a single runtime instance
- uses explicit storage errors when writes are unavailable
- supports an env-driven read-only demo mode

What it does not do:

- make writes durable across deployments
- make writes safe across multiple serverless instances
- provide production-grade persistence

If a write cannot be safely completed, the app now fails honestly instead of returning a fake success response.

### Theme toggle locations

The user-facing theme toggle currently appears in:

- the homepage header
- the footer action stack
- the Client Workspace header
- the Admin Dashboard header
- the account welcome page

### Resetting local auth data

In normal local use, the seeded admin account is repaired automatically if a stale account file is missing it or has the wrong role/password for the seeded email.

If you want to fully reset local auth state anyway:

1. stop the Next.js dev server
2. delete `client/data/accounts.local.json`
3. clear the `mirror_progress_session` cookie or log out
4. restart the app and log in again with the seeded credentials above

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend caveat:

- `backend/app/core/database.py` imports `motor`
- `motor` is not currently listed in `backend/requirements.txt`

## Commands

### Frontend

```bash
cd client
npm run dev
npx tsc --noEmit
npx next build
npm run start
npm run format
```

Current verification status:

- `npx tsc --noEmit` passes
- `npx next build` passes
- `npm run lint` still fails because the existing lint script/config is broken

### Backend

```bash
cd backend
uvicorn app.main:app --reload
```

## Storage and Auth Notes

### Auth

- passwords are hashed with Node `crypto.scryptSync`
- session state is stored in an HTTP-only signed cookie
- cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production
- account records include role, status, client assignment, project assignment, invite state, and last login
- this is a lightweight prototype auth system, not a production identity platform

### Deployment protections

The app now adds lightweight hardening around the current MVP architecture:

- app-level protected mode with a separate deployment access gate
- env-controlled public signup and password reset behavior
- env-controlled seeded dev account behavior
- lightweight rate limiting on login, signup, forgot-password, reset-password, deployment access, and admin mutation routes

That rate limiting is best-effort only. On Vercel it is per-instance memory, not a global abuse-prevention layer.

### Platform data

The admin dashboard and client workspace both read from the same file-backed platform record:

- clients
- projects
- milestones
- decisions
- action items
- resource links
- activity log

### Internal-only vs client-visible content

The shared model supports visibility boundaries:

- project internal notes are admin-only
- milestone internal notes are admin-only
- decisions, action items, and resources carry `clientVisible` flags
- the client workspace only renders the client-visible subset

## MVP Scope

### Included

- one-page homepage
- toggleable dark and light themes
- public client signup/login
- protected Client Workspace
- protected Admin Dashboard
- file-backed platform data
- project editing
- milestone editing
- decision management
- action item management
- client access management
- activity logging

### Intentionally out of scope

- 2FA
- advanced invitation flows
- real multi-user collaboration
- threaded comments
- chat
- invoicing
- time tracking
- production-grade backend infrastructure

## Known Risks / Gaps

- JSON-backed persistence remains limited and non-durable on Vercel.
- The auth and storage model is intentionally MVP-grade rather than production-grade.
- The separate FastAPI backend is still present and still not integrated into the active frontend path.
- `client/pages/api/sendMail.ts` and `client/pages/api/work.ts` still contain separate security/config debt outside the workspace/admin MVP.
- The frontend lint setup is still broken.
- Client creation currently uses a lightweight admin-managed account flow rather than a full invitation system.
- The light theme is now implemented across the major active surfaces, but inactive sections like the optional `Work` component still carry older styling assumptions.

## Recommended Next Steps

If Mirror Progress continues investing in this platform, the clean next step is to keep the active product inside the Next.js app and deepen the shared platform data layer before considering a larger backend split.

The highest-value follow-ups would be:

- moving auth/workspace/admin storage to a real durable database while keeping the active backend in Next.js
- stronger validation around admin mutations
- a more explicit invitation flow
- tighter audit history with actor ids and richer metadata.

# Mirror Progress Engineering Review

Updated after the Admin Dashboard implementation.

## Executive Summary

The active product remains the Next.js application in `client/`. The platform now has three connected layers inside the same app:

1. the one-page marketing homepage
2. the protected Client Workspace
3. the protected internal Admin Dashboard

This is a more coherent direction than pushing new product work into the separate FastAPI service that the active frontend still does not use.

## Verification Status

Legend:

- `Verified by code inspection`
- `Verified by local command/output`
- `Inferred but not fully verified`

| Claim | Status | Evidence |
| --- | --- | --- |
| The active homepage is still a single-page Next.js Pages Router experience | Verified by code inspection | `client/pages/index.tsx` |
| The active homepage still renders `Hero`, `Capabilities`, `Form`, and `Footer` | Verified by code inspection | `client/pages/index.tsx` |
| Auth, workspace, and admin all live inside the Next.js app | Verified by code inspection | `client/pages/api/auth/*`, `client/pages/api/admin/mutate.ts`, `client/pages/workspace/index.tsx`, `client/pages/admin/*` |
| The Client Workspace now reads from a shared platform store instead of a one-off generated snapshot | Verified by code inspection | `client/lib/platform-store.ts`, `client/lib/workspace-data.ts`, `client/pages/workspace/index.tsx` |
| The Admin Dashboard is protected by role-aware server-side checks | Verified by code inspection | `client/lib/auth-guards.ts`, `client/pages/admin/*` |
| The active Next.js app now supports a persistent dark/light theme system | Verified by code inspection | `client/hooks/useTheme.tsx`, `client/components/ThemeToggle.tsx`, `client/pages/_app.tsx`, `client/styles/globals.css` |
| Public signup still creates `client` users only | Verified by code inspection | `client/pages/api/auth/signup.ts`, `client/lib/accounts.ts` |
| Seeded internal admin accounts exist for local development | Verified by code inspection | `client/lib/accounts.ts` |
| A dev Super Admin login is seeded at `admin@mirrorprogress.local` and reconciled into the local account store | Verified by code inspection | `client/lib/accounts.ts`, `README.md` |
| Protected deployment mode now supports an app-level access gate and env-controlled signup/reset restrictions | Verified by code inspection | `client/middleware.ts`, `client/pages/access.tsx`, `client/pages/api/access.ts`, `client/lib/app-runtime.ts` |
| Sensitive auth/admin endpoints now have lightweight throttling | Verified by code inspection | `client/lib/rate-limit.ts`, `client/pages/api/auth/*`, `client/pages/api/admin/mutate.ts` |
| JSON write failures now surface explicit server errors instead of silent success | Verified by code inspection | `client/lib/storage.ts`, `client/lib/accounts.ts`, `client/lib/platform-store.ts`, `client/lib/password-resets.ts`, `client/lib/workspace-store.ts` |
| Internal-only notes exist at the project and milestone level and are not shown in the client workspace | Verified by code inspection | `client/lib/workspace-data.ts`, `client/lib/platform-store.ts`, `client/components/workspace/*` |
| Activity logging is file-backed and updated by admin mutations | Verified by code inspection | `client/lib/platform-store.ts`, `client/pages/api/admin/mutate.ts` |
| `npx tsc --noEmit` passes | Verified by local command/output | command completed successfully |
| `npx next build` passes and includes `/admin` and `/workspace` routes | Verified by local command/output | build output listed `/admin`, `/admin/projects`, `/admin/clients`, `/admin/activity`, and `/workspace` |
| `npm run lint` still fails | Verified by local command/output | existing `lint` script still invokes invalid ESLint options |

## Current Product Shape

### Theme system

The active app now has a shared theme layer across marketing, auth, workspace, and admin surfaces.

- default theme: `dark`
- alternate theme: `light`
- persistence: `localStorage`
- early application: `beforeInteractive` theme-init script in `_app.tsx`

The current light theme is built as a designed reinterpretation of the product rather than a simple inversion. It uses cool luminous backgrounds and deep blue panel surfaces so the workspace and admin layers still read as calm, high-trust briefing interfaces.

### Marketing surface

The active marketing experience remains one page:

1. Hero
2. Capabilities
3. Contact
4. Footer

### Client-facing authenticated surface

The Client Workspace remains a lightweight project record:

- route: `/workspace`
- purpose: a shared source of truth for what happened, what was decided, what comes next, who owns it, and by when

### Internal authenticated surface

The Admin Dashboard is now the internal control center for the workspace platform:

- `/admin`
- `/admin/projects`
- `/admin/projects/[projectId]`
- `/admin/clients`
- `/admin/activity`

## Architecture Decision

### Chosen direction

The admin layer was implemented inside the existing Next.js app.

### Why this fits the repository

- the verified active product surface is already `client/`
- the auth system already lived in Next.js
- the workspace already lived in Next.js
- the frontend still does not call FastAPI
- the new feature is operational UI around the same project record, not a separate product with different runtime needs

### Recommended default path

Continue treating the Next.js app as the main application surface until storage, concurrency, and operational complexity clearly justify a backend split.

## Role and Access Model

### Current roles

- `super_admin`
- `admin`
- `project_lead`
- `client`

### Current behavior

- public signup creates `client` users
- internal admin/project lead users are seeded locally
- admin routes require an authenticated account with an internal role
- non-admin users are redirected away from admin routes
- signed-in menu links are role-aware

Protected deployment defaults now move in a safer direction:

- public signup should be disabled
- password reset should usually be disabled unless the demo reset-link flow is intentionally needed
- seeded dev accounts can be disabled so known local credentials are not active on the deployed app

### Local Super Admin development access

The current dev Super Admin account is:

- email: `admin@mirrorprogress.local`
- password: `MirrorProgressAdmin123!`
- role: `super_admin`

This account is seeded in `client/lib/accounts.ts`. The seed merge is idempotent in local development and keeps seeded accounts present while preserving later local changes such as project assignments and password resets.

Protected deployment note:

- seeded dev accounts are now disabled by default when protected mode is enabled
- they can be re-enabled intentionally with `ALLOW_DEV_SEED_ACCOUNTS=true`

### Storage location

Role and access state live in `client/lib/accounts.ts` and persist to:

- `client/data/accounts.local.json`
- `client/data/password-resets.local.json`

The account model now includes:

- role
- status
- client assignment
- assigned project ids
- invite state
- last login timestamp

## Shared Data Model

The platform now uses a shared file-backed data store in:

- `client/lib/platform-store.ts`
- persisted to `client/data/platform.local.json`

### Core entities

- `ClientRecord`
- `ProjectRecord`
- `MilestoneRecord`
- `DecisionRecord`
- `ActionItemRecord`
- `ResourceRecord`
- `ActivityLogRecord`

These types live in:

- `client/lib/workspace-data.ts`

### Visibility model

The current internal/client visibility split is explicit:

- `ProjectRecord.internalNotes`
  - internal only
- `MilestoneRecord.internalNotes`
  - internal only
- `DecisionRecord.clientVisible`
- `ActionItemRecord.clientVisible`
- `ResourceRecord.clientVisible`

The client workspace only renders the client-visible subset.

## Client Workspace Architecture

### Entry point

- `client/pages/workspace/index.tsx`

### Behavior

- protected via server-side session check
- loads the signed-in account
- reads the shared platform store
- finds the account’s assigned project or matching client project
- records last-viewed timestamp
- builds a client-safe workspace snapshot from the shared data

### Current user experience

If a client account has no assigned project yet, the workspace shows an access-pending state instead of pretending data exists.

## Admin Dashboard Architecture

### Shared admin shell

- `client/components/admin/AdminShell.tsx`
- `client/components/admin/shared.tsx`

### Dashboard overview

- `client/pages/admin/index.tsx`

Includes:

- Active Projects
- Awaiting Client
- Projects In Progress
- Overdue Items
- Completed This Month
- recent project updates
- upcoming milestones
- projects requiring attention
- recent activity
- recent client login/workspace-view signals

### Projects directory

- `client/pages/admin/projects/index.tsx`

Includes:

- project list
- status/client/lead/phase filters
- search
- overdue-only filter
- lightweight project creation form

### Project detail editor

- `client/pages/admin/projects/[projectId].tsx`

Includes:

- project overview editor
- project internal notes
- client record editor
- client access editor
- milestone editing
- decision editing
- action item editing
- resource links
- activity history

### Clients area

- `client/pages/admin/clients.tsx`

Includes:

- client account list
- account status/invite state editing
- project assignment
- last login
- last viewed
- lightweight client account creation flow

### Activity log

- `client/pages/admin/activity.tsx`

### Mutation surface

- `client/pages/api/admin/mutate.ts`

This single admin mutation route currently handles:

- project create/update
- milestone create/update
- decision create/update
- action item create/update
- resource create/update
- client record create/update
- client access updates

## Storage and Security Assessment

### Strengths

- passwords are hashed with `crypto.scryptSync`
- sessions are stored in signed HTTP-only cookies
- admin routes are server-side protected
- client/admin product layers now share a single file-backed project record
- activity logging is explicit rather than implied

### Current MVP tradeoffs

- all persistence is still local file-backed JSON
- Vercel/serverless does not turn that JSON into durable shared storage
- admin mutations are lightweight and not heavily validated
- seeded local credentials are committed for local development convenience, so protected deploys should disable dev seed accounts by default
- invitation handling is still lightweight and not a full email-driven flow
- password reset now exists as a demo reset-link workflow and should usually stay disabled in protected deployments
- activity logging is useful but still minimal in metadata depth

### Deployment hardening now in place

- app-level access gate via middleware and `/access`
- env-driven signup, reset, and seed-account behavior
- explicit JSON storage write failures instead of false-success responses
- best-effort throttling on auth-sensitive and admin mutation routes
- stronger session-secret expectations for protected and production-like deployments

## Remaining Repository Risks

These pre-existing issues still remain outside the new admin work:

- `client/pages/api/sendMail.ts` still contains security/config debt
- `client/pages/api/work.ts` still contains security/config debt
- `backend/.env` remains tracked
- the FastAPI backend still exposes unauthenticated contact data
- the frontend lint setup is still broken

## Dependency Notes

### Meaningfully used frontend packages in the active app

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `gsap`
- `@gsap/react`
- `@headlessui/react`
- `@heroicons/react`
- `nodemailer`

### No new external packages were added for admin

The admin layer uses:

- Node `crypto`
- `fs/promises`
- existing Next.js pages, API routes, and React state

## Appendix: File-Level Notes For Admin Layer

- `client/lib/accounts.ts`
  - seeded internal users
  - role/status-aware account model
  - last-login tracking

- `client/lib/platform-store.ts`
  - file-backed platform store
  - seeds clients, projects, milestones, decisions, action items, resources, activity
  - appends activity entries on admin mutations

- `client/lib/workspace-data.ts`
  - shared platform entity types
  - client-visible workspace transformation logic

- `client/lib/auth-guards.ts`
  - API and page-level admin protection helpers

- `client/hooks/useAdminMutation.ts`
  - lightweight admin mutation helper for page forms

- `client/pages/api/admin/mutate.ts`
  - central admin mutation endpoint

- `client/pages/admin/index.tsx`
  - overview dashboard

- `client/pages/admin/projects/index.tsx`
  - projects directory and project creation

- `client/pages/admin/projects/[projectId].tsx`
  - project detail editor and internal notes

- `client/pages/admin/clients.tsx`
  - client account and invite-state management

- `client/pages/admin/activity.tsx`
  - activity log view

- `client/pages/workspace/index.tsx`
  - now reads from shared platform data rather than a one-off generated project record

- `client/hooks/useTheme.tsx`
  - persistent theme provider for dark and light modes

- `client/components/ThemeToggle.tsx`
  - shared user-facing theme toggle

- `client/styles/globals.css`
  - semantic theme tokens, atmospheric backgrounds, and shared themed surfaces

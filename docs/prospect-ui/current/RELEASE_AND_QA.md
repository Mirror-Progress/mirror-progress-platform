# Prospect source, release, and QA guide

## Which code is authoritative

Production runs the private `identity-release/client` checkout, built as an ARM64 container and deployed to the Mirror Progress platform ECS service. The repository root `client/` describes an older application baseline. This public directory contains selected text snapshots of the private release. A source snapshot commit is **not** a deployment, and an ECS deployment is **not** automatically reflected on GitHub. Report both steps separately.

To refresh a snapshot, copy the corresponding file from `identity-release/client` to `docs/prospect-ui/current/client/<same relative path>.txt`. Add a new snapshot when a new runtime module is needed to understand the change. Do not copy `.env` files, local account data, customer files, baseline datasets, build output, or Docker layers. Keep the link map in this directory's README current. For runnable work, use the private release checkout and its `AGENTS.md` instructions.

## Validation for a Prospect change

1. Run focused behavioral tests for the changed data contract, then TypeScript and `npm run build` in the private release checkout.
2. For UI changes, inspect the affected desktop and mobile state in a stable local preview. Check light and dark appearance when relevant. A successful build cannot establish that a spotlight, popover, or chat layout looks right.
3. For API changes, verify access denial for an unauthenticated user and correct account/organization scoping for an authorized user when a suitable test session exists.
4. If publishing, build and deploy the release image, wait for the ECS service to become stable at its desired task count, and check the live health endpoint. Then test the specific production interaction if access permits.
5. Refresh these snapshots and notes from the deployed source. Use a commit that skips GitHub Actions while the owner has directed that Actions must not run. Do not use the repository's old Vercel workflow to publish Prospect.

## Recent QA: September 27, 2026

| Area | Reported behavior | Change in the current source record | Verification limit |
| --- | --- | --- | --- |
| My saved web project | Raw search headline put an address into the project title; fields were inconsistent | Bedrock extraction proposes a clean record, source quotes gate fields, and bounded owner reads can repair legacy saves | Focused normalization tests and a live Bedrock synthetic example passed; the customer's individual legacy record was not inspected after repair |
| Chat reload | Reload reopened the full assistant panel | Main Prospect initializes chat minimized; the corner MP logo remains available, with dots only for working/answer-ready states | TypeScript/build and service health passed |
| Portfolio walkthrough | Text behind the highlighted menu item showed through; hover glow was offset/clipped; label used lowercase “portfolio” | Tour menu uses an opaque surface, pauses its entrance animation while measured, removes target hover translation, tightens/centers its ring, and labels “Firm Portfolio” | TypeScript/build and service health passed; exact visual review of this tour step still needs a stable local or production browser session |

## Globe UI QA: September 29, 2026

GaMarry’s annotated screenshots showed a redundant selected-project card obscuring the globe, no clear way to deselect a marker, an ambiguous marker glow, an awaiting-location menu with weak active feedback, and a floating MP icon that covered source text. The deployed source removes the extra card, lets a user clear selection by tapping the selected marker or empty globe, labels the selected state, improves the awaiting-location menu’s open state and spacing, and makes the minimized MP icon smaller and translucent. Selection is preserved during globe dragging. TypeScript, the production build, and a local empty-globe deselection check passed. The exact mobile overlap and whether awaiting-location should become a side list remain design questions.

## iPad touch QA: September 29, 2026

The globe now owns touch gestures and disables native text selection inside its viewport, preventing finger rotation from selecting page text. The floating chat accepts touch dragging from its header while leaving conversation scrolling available. Pointer tracking uses the active touch identifier instead of mouse-button state. TypeScript, focused lint, the production build, and the local Prospect route passed; the owner subsequently verified the improvement on iPad.

## Trackpad globe navigation: September 29, 2026

Pixel-resolution two-finger trackpad swipes over the globe now rotate it without a click. Browser pinch gestures retain zoom, as do line/page wheel events and the zoom controls. The on-screen guidance matches the new gesture. TypeScript, focused lint, and the local Prospect route passed before release; physical trackpad behavior should be checked after deployment.

## Portfolio import QA: October 1, 2026

The former 4 MB client, API, and service limits have been raised to 40 MiB. Import parsing now extracts readable text from PDF, CSV, XLSX, DOCX, TXT, and Markdown before calling Bedrock, avoiding Bedrock Converse's 4.5 MB per-document limit. Large imports keep the HTTP connection active during extraction; the review screen reports when only the first 120,000 characters were processed. A scanned large PDF without selectable text gives an actionable error instead of a raw model failure. An internal-admin item in the normal Prospect account menu now opens the existing Mirror Identity invitation manager, where admins can enter a name, email, and trial length and see sent status. Format extraction tests, TypeScript, focused lint, and the production build passed. A customer-file upload and exact physical-device behavior remain to be verified after deployment.

## Product checks worth repeating

- Reload Discovery with a closed chat: the corner icon appears, the full panel stays closed, and opening it restores the conversation.
- While MP is answering, close the panel: the small logo indicates work and the completed response is recoverable.
- Start or replay the walkthrough with portfolio management access: the Firm Portfolio link is readable, the spotlight follows its position, and no underlying Discovery text appears inside it.
- Hover the Firm Portfolio link during that step, including at a mobile width: the highlight stays centered and has complete rounded edges.
- Ask MP to save a web-found project whose search title starts with a street address: the saved title contains only the project name, the address is separate, unsupported fields stay empty, and the item appears in My saved after reload.
- Open a project source from Discovery and return: theme and chat conversation stay continuous.

## Handoff to another agent

Give the agent this directory's README first. Explain that `.txt` files are source snapshots and the actual release checkout is private. Ask it to cite the snapshot path it changed, validate in the release checkout, and keep publication separate from GitHub synchronization. If the agent has only GitHub access, it can review and plan from these snapshots and docs but cannot safely rebuild or deploy Prospect from the obsolete root client.

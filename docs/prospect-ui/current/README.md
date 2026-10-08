# Prospect: current product and source record

**Prospect** is Mirror Progress's project-discovery workspace for architecture and design practices. The customer-facing entry point is [platform.mirrorprogress.com/prospect](https://platform.mirrorprogress.com/prospect). Its purpose is to help a firm find relevant work, understand why a project may matter, inspect the underlying evidence, and connect new opportunities to the firm's own portfolio. The assistant is part of that workflow; it is not a separate product or a general-purpose Mirror Progress chat.

This directory is the **public, reviewable source record** for the currently deployed private Prospect release. `client/` at the repository root is an older baseline and is **not** the code deployed at the Prospect URL. Runtime source lives in a private `identity-release/client` checkout. Files below `docs/prospect-ui/current/client/` mirror selected runtime paths with a `.txt` suffix, so GitHub can show their contents without suggesting that the obsolete root `client/` is deployable. These snapshots contain no customer project database, account records, credentials, or deployment secrets. They are useful for review and for an agent planning changes, but do not form a standalone runnable release.

The snapshot set is intentionally partial. Newer access-control, billing, invitation, and internal endpoint changes are not mirrored here, so the snapshots in those areas may lag the live release and should not be treated as its security source of truth. Infrastructure identifiers (AWS account IDs, IAM and AgentCore ARNs, gateway URLs, ECS cluster, service and task-definition names, and image digests) are replaced with placeholders such as `<aws-account-id>`.

Start with [product goals and business context](PRODUCT_CONTEXT.md), then [architecture and data contracts](ARCHITECTURE.md), and [release and QA guidance](RELEASE_AND_QA.md). Those documents distinguish implemented behavior from future ideas. Previous feature-by-feature release notes remain in this repository's Git history.

## What the customer sees

1. **Discovery:** a globe and list of sourced opportunities, filters, favorites, project detail, and a quiet Market Pulse ticker. A country marker is not a precise site coordinate. The ticker is sourced macro context with its own observation dates, not project-specific analysis.
2. **Evidence:** each sourced opportunity exposes provenance. The Source workspace lets a user read captured sections, switch reading modes where translations exist, keep notes, and ask the same assistant about the selected source.
3. **Firm Portfolio:** authorized firm admins can import project files, review extracted fields, and approve practice precedents. Prospect can use verified precedents for fit context; a firm with no portfolio can still browse and use Discovery.
4. **Ask MP:** the Bedrock-backed assistant can search the visible project catalog, inspect evidence, compare projects, read Market Pulse data, search the public web when enabled, save a web-found project privately, and guide a user through active UI workflows. It shares account-backed chat history across Discovery and Evidence. A minimized corner logo does not end a running response.
5. **Access:** Mirror Progress Identity owns sign-in, passkeys, invitations, and self-service credential recovery. Prospect enforces product and organization access. Configured trials begin on the invited user's first successful sign-in; an expired trial keeps account access but blocks workspace interaction behind a billing prompt.

## Key source snapshots

| Area | Snapshot entry point |
| --- | --- |
| Main Prospect UI and responsive layout | [StudioIqTerminal.tsx](client/components/studioiq/StudioIqTerminal.tsx.txt) |
| Guided screens and spotlight geometry | [ProspectWalkthrough.tsx](client/components/studioiq/ProspectWalkthrough.tsx.txt), [workflow registry](client/lib/studioiq-walkthrough.ts.txt) |
| Discovery and private saved projects | [discovery API](client/pages/api/products/studioiq/discovery.ts.txt), [private project model](client/lib/prospect-private-projects.ts.txt) |
| Assistant tools and stream | [agent runner](client/lib/prospect-agent/run.ts.txt), [agent API](client/pages/api/products/studioiq/agent.ts.txt) |
| Bedrock project cleanup | [project normalization](client/lib/prospect-agent/project-normalization.ts.txt) |
| Source reading | [ProspectSourceWorkspace.tsx](client/components/studioiq/ProspectSourceWorkspace.tsx.txt) |
| Portfolio import | [portfolio page](client/pages/apps/studioiq/portfolio.tsx.txt), [import service](client/lib/studioiq-portfolio-import.ts.txt), [text extraction](client/lib/studioiq-portfolio-text.ts.txt), [import API](client/pages/api/products/studioiq/portfolio-imports.ts.txt) |
| Saved searches | [bounded saved-search store](client/lib/prospect-saved-searches.ts.txt), [concurrency checks](client/tests/prospect-fix-discovery-workspace.test.ts.txt) |
| Behavior checks | [private project tests](client/tests/prospect-private-projects.test.ts.txt), [walkthrough tests](client/tests/studioiq-walkthrough.test.ts.txt) |

## Source-record status

The October 7, 2026 production release and its verification limits are recorded in the release guide. The snapshots are partial; the saved-search store and its focused test were refreshed after that release, while access-control and billing snapshots may lag the private runtime. Earlier QA and remaining visual checks are recorded in [RELEASE_AND_QA.md](RELEASE_AND_QA.md).

Use [RELEASE_AND_QA.md](RELEASE_AND_QA.md) before modifying or publishing anything. In particular, do not copy these snapshots into the repository's root `client/` or run the root's old Vercel workflow as a Prospect release.

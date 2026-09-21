# Migration progress

Updated 2026-09-21. Production has not been changed.

## Completed

- Isolated worktree and published migration branch; draft PR #18.
- Live task revision/image matches the saved release archive SHA-256.
- Credential-free auth reference code published from that exact release.
- AWS root CLI authentication renewed through the user-provided login code.
- Dedicated local PostgreSQL 17 Docker instance healthy on loopback port 55432.
- Baseline authorization, PKCE and JWKS suites: 13 passed, zero failed.
- Verified application archive passes TypeScript checking with Node 24.
- Current production Cognito pool inventory: three enabled, confirmed accounts.
- ChatGPT assigned the standalone Better Auth implementation and CI batch.

## In progress

- ChatGPT code artifact; its environment reports npm registry access is blocked.
  Codex must verify dependencies, actual API compatibility, migrations and tests.
- Separate ChatGPT batches cover identity-infra/ and identity-bridge/; integration
  remains sequential after their isolated tests pass.
- Application integration will use the verified production baseline, not old main.
- ChatGPT service source handoff failed after its container changed. Execution
  records show earlier source generation, but no original service ZIP is available
  locally. Reconstruction from records is requested. Do not count those files as
  delivered or earlier isolated tests as full-service validation.
- Provider/bridge assurance contracts conflict with current Better Auth reserved
  claim behavior; see PROVIDER-CONTRACT-REVIEW.md. Reconciliation is mandatory.
- The bridge conversation returned a 27-file artifact and reports 60 isolated
  utility tests. Full dependency-backed checks are unrun. The in-app browser did
  not expose its download to the local workspace; user handoff requested. No
  generated service/bridge/infrastructure source is committed at this point.

## Download handoff received

The user downloaded identity-bridge.zip. Its 27-file source has now been imported
under identity-bridge/ only, disconnected from all application routes. Actual
Node 24 dependency-backed typecheck, build and 206 tests passed locally. A fresh
registry-resolved integrity lock and synthetic GitHub Actions checks were added.
See identity-bridge/INTEGRATION-STATUS.md for unresolved integration blockers.
The separately downloaded mirror-progress-wp1-recovered.zip is unrelated to this
authentication package and was not applied.

GitHub check at implementation commit 927ff1203c6b650a3df2a64ca4953c19c77ba228
could not start: run 35623112518 has no executed steps and its check annotation
states the account is locked due to a billing issue. This is not a test failure
and is not a CI pass. Local Node 24 checks were repeated after regenerating the
registry integrity lock: typecheck/build/206 tests pass, zero skipped. No billing
settings were modified. Service source still requires the correct reconstructed
authentication ZIP from the original ChatGPT conversation.

## Cutover blockers

- SES in us-east-1 has productionAccess=false and review status DENIED. Only a
  verified domain is configured; do not assume ordinary external recipients can
  receive enrollment email. Resolve an approved transactional delivery path.
- New service, app integration, staging rehearsal, privileged enrollment and
  independent security review are not complete.
- A registry audit of the verified application's production dependency lock
  reports five affected package entries: Next (critical), nodemailer, nanoid and
  sharp (high), postcss (moderate). This is dependency advisory evidence, not proof
  of exploitability. Assess applicability and patch/test the reconciled release
  before approving its security gate. Do not confuse this with the much larger
  advisory count on the obsolete GitHub default branch.

## Validation limits

The application-only release archive lacks infrastructure/docs expected by some
repository-wide tests. A broader portal suite had 18 passes and one missing-file
failure (infra/lib/platform-stack.ts); this is not a complete release test pass.
The initial install used an old default Node; dependencies were reinstalled with
Node 24 before the successful focused baseline test run.

Additional baseline checks: lint fails with 38 pre-existing errors in three
operational scripts. Build passes compilation/type validation/static generation
but fails during build tracing with ENOSPC. The Mac data volume had about 126 MiB
available before cleanup. Only the task-created `.next/cache` (188 MiB) was
removed; it is regenerable. Do not claim a successful full build. Additional disk
capacity is required for reliable full builds and container/staging work.

Do not mark the migration complete, deploy generated code, disable Cognito or send
enrollment email based on the preparatory evidence in this document.

# Migration progress

Updated 2026-09-21. Production has not been changed.

## Completed

- Isolated worktree and published migration branch; draft PR #18.
- Live task revision/image matches the saved release archive SHA-256.
- Credential-free auth reference code published from that exact release.
- AWS root CLI authentication renewed through the user-provided login code.
- Dedicated local PostgreSQL 17 Docker instance healthy on loopback port 55432.
- Baseline authorization, PKCE and JWKS suites: 13 passed, zero failed.
- Current production Cognito pool inventory: three enabled, confirmed accounts.
- ChatGPT assigned the standalone Better Auth implementation and CI batch.

## In progress

- ChatGPT code artifact; its environment reports npm registry access is blocked.
  Codex must verify dependencies, actual API compatibility, migrations and tests.
- Application integration will use the verified production baseline, not old main.

## Cutover blockers

- SES in us-east-1 has productionAccess=false and review status DENIED. Only a
  verified domain is configured; do not assume ordinary external recipients can
  receive enrollment email. Resolve an approved transactional delivery path.
- New service, app integration, staging rehearsal, privileged enrollment and
  independent security review are not complete.

## Validation limits

The application-only release archive lacks infrastructure/docs expected by some
repository-wide tests. A broader portal suite had 18 passes and one missing-file
failure (infra/lib/platform-stack.ts); this is not a complete release test pass.
The initial install used an old default Node; dependencies were reinstalled with
Node 24 before the successful focused baseline test run.

Do not mark the migration complete, deploy generated code, disable Cognito or send
enrollment email based on the preparatory evidence in this document.

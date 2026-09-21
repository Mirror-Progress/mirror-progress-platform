# Verified production baseline

Verified 2026-09-21 using live ECS metadata and the saved release archive.

- Live platform task revision: 43; two running tasks; completed rollout.
- Image digest: sha256:51f5531fc85e3284ed4fddc25badb0eb9a7cb7ecfcb5dc7c38897fc916423512.
- Source archive SHA-256: b43b65206d6aea6bf815e256ea734e2da377d8ccb7e9c5da764c8277588af9e3.
- Saved release: prospect-brand-b43b65206d6aea6b, September 19, 2026.
- Public platform health endpoint returned ok=true.

The CloudFormation output still names task revision 31 while the running service
uses revision 43. Do not redeploy the existing stack with stale image/configuration
defaults. Reconcile the live task definition before integration deployment.

The public GitHub main baseline is dc1240d8f9e9de205f87ebcb9fdfebafe629dc67.
It is not the current deployed app. The service foundation can build independently;
application integration must be based on the verified release above. Local archive
contains data assets and is not approved for wholesale publication to public GitHub.

## Tool evidence

Codex verified repository push permission by publishing the isolated migration
branch. GitHub Actions is enabled. No deployment workflow has been dispatched.
ChatGPT's latest schema discovery reports read-only repository and Actions tools,
contradicting its earlier claimed write capabilities. The coding fallback is a
downloadable patch/artifact; Codex applies and verifies it, then publishes PRs/CI.

## Validation environment

Local synthetic PostgreSQL uses a dedicated Docker container on loopback port
55432. Production databases and accounts are not used by these tests. The service
must also pass CI against PostgreSQL before any staging deployment.

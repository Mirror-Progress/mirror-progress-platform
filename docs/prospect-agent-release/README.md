# Prospect agent release

The production application is built from the verified, private release workspace described in `../identity-migration/BASELINE.md`. The root `client/` in this repository is an obsolete public baseline, so these source files retain the existing `.txt` integration-candidate convention. They are the exact feature source used for the September 23, 2026 Prospect release, with SHA-256 digests in `candidate/manifest.json`. This repository intentionally excludes the private release archive and datasets.

The agent lives inside the authenticated Prospect page at `/apps/studioiq`. Its chat can expand and resize alongside the globe and project dossier. The composer grows with the message; responses render Markdown, tables, and equations. The agent uses Amazon Bedrock's ConverseStream API and read-only, workspace-scoped project tools. The local sample endpoint is disabled in production. No invitation sending is part of this release.

The release workspace added these application dependencies: `@aws-sdk/client-bedrock-runtime@^3.1138.0`, `react-markdown@^10.1.0`, `remark-gfm@^4.0.1`, `remark-math@^6.0.0`, `rehype-katex@^7.0.1`, and `katex@^0.16.47`. The private release lockfile remains with the verified release workspace.

The ECS application task role requires `bedrock:InvokeModelWithResponseStream` and `bedrock:InvokeModel` for the `us.anthropic.claude-sonnet-4-6` inference profile and its three foundation-model destinations. The exact scoped role policy is in `bedrock-task-policy.json`. The application uses the task role, not static AWS credentials.

The September 23 live image is `mirror-identity-production@sha256:c6a1fa9067d46208861de7761755a5aff360ebd46fa27cf6e08c3c2bf42e3b0d` in AWS account `380314682150`. It was registered as platform ECS task revision 49. The previous task revision was 48.

To verify the published candidate files, run `node verify.mjs` from this directory. The live image is built from the private release workspace, then deployed to the platform ECS service with a new task-definition revision. This candidate is for review and integration against that verified source; it is not a standalone application.

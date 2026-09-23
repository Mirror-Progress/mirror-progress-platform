# Independent Identity infrastructure

Local-only CDK foundation candidate. No deploy entry point, DNS record, ECS service,
email permission, account import or Cognito mutation is created by this package.
The root platform stack must never be redeployed to install Identity.

Run Node 24 `npm ci --ignore-scripts` and `npm run check` to typecheck and synthesize
assertions entirely offline, with synthetic account/subnet identifiers.

The foundation imports an explicitly identified existing VPC and two private
subnets, then defines dedicated security groups, retained KMS keys, an immutable
encrypted image repository, retained encrypted Multi-AZ PostgreSQL 17 with TLS,
35-day backups and deletion protection, separate generated owner/runtime/auth/
session-status/delivery secrets, and retained encrypted logs. Outputs contain
identifiers only. No plaintext secret value is accepted by the construct.

Before any live deployment: verify target account, engine minor availability,
subnet/AZ and NAT/VPC endpoint reachability, CloudTrail coverage, DNS ownership,
budget and exact change-set contents. Supply no production values to tests.
Database owner secret must only reach explicit migration tasks, never the service.
Runtime grants and operator mappings are implemented/tested in identity/.

Still required: separate service/ALB/WAF and migration task definitions; compatible
TLS container bootstrap and health routing; scoped execution/task IAM; actual
database/runtime secret rotation and reconciliation; backup/restore/staging
rehearsal; current credentials and independent review. Custom auth/delivery-key
rotation must be coordinated with session and queued-message lifecycle; blindly
rotating those secrets would lose decryptability. No automatic rotation or live
security readiness is claimed by the foundation tests.

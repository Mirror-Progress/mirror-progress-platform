# Independent Identity staging deployment

Additive CDK stacks, separate from the original platform stack. Never redeploy the
root platform stack to install Identity. No production hostname, Cognito resource,
principal, membership or email is changed by these stacks.

Use Node 24 `npm ci --ignore-scripts` and `npm run check` for typechecking and four
offline synthesis tests. `node identity-infra/dist/src/synth-staging.js` from the
repository root writes the verified staging foundation template. Adding `--service`
requires `IDENTITY_IMAGE_DIGEST=sha256:...` from the actual ECR image; the service
initially has desiredCount=0. Synthesis itself performs no deployment.

The retained foundation contains encrypted Multi-AZ PostgreSQL 17.11 in isolated
data subnets, 35-day backups, deletion protection, immutable ECR, separate generated
secrets and dedicated network groups. The service stack adds only the Identity
staging hostname/certificate, TLS ALB, WAF per-IP rate limit, private ARM64 Fargate
service and separate one-off migration task. It does not start migrations itself.

Runtime execution can retrieve runtime/auth/status/delivery secrets, never the
owner secret. Migration execution has owner access. Application task roles have
no AWS API grants. KMS decrypt is scoped to Secrets Manager. The service is
non-root, read-only, with a small writable ephemeral TLS directory. RDS certificates
are verified using the pinned public AWS trust bundle in identity/certs. ALB frontend
TLS uses ACM; backend TLS uses an ephemeral per-task certificate. Only the ALB
security group reaches service and readiness ports. The auth listener enforces the
canonical Host; the separate health listener exposes only readiness.

Deploy order: validate the generated template and review an add-only change set;
apply foundation with termination protection; publish the tested image by immutable
digest; apply service at zero instances; run the explicit migration task in private
application subnets with only the operator security group; require exit code zero;
then update the staged desired count to one. Check real HTTPS and database/session
behavior before integrating the application or any human accounts. Snapshot and
restore rehearsal, enrollment, review and application rollback remain cutover gates.

Keys rotate annually through KMS. Automatic rotation of authentication/delivery
values is intentionally not enabled: it requires coordinated session invalidation
and queued-message handling. Database password rotation likewise requires database
and Secrets Manager reconciliation plus replacement tasks; current runtime uses
launch-time injected secrets. No full rotation rehearsal has been claimed.

Inventory and deployment evidence: docs/identity-migration/AWS-STAGING-INVENTORY.md.

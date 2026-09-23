# Production readiness and permission reconciliation

September 23, 2026. Preparation only; production is unchanged on task revision43.
Staging is healthy on Cognito rollback29. Full evidence is in
[the staging rehearsal](ALB-STAGING-REHEARSAL.md) and
[image advisory review](IMAGE-ADVISORY-REVIEW.md).

## Verified permission boundary

Read-only AWS task-definition and IAM-policy inspection confirms:

| Principal | Actual staging access | Production preparation requirement |
| --- | --- | --- |
| Identity runtime task role | No attached or inline identity policies | Preserve no AWS API privileges unless a specific runtime need is justified |
| Identity runtime execution role | Exact four runtime/auth/status/delivery secrets, image repository, log group, scoped Secrets Manager KMS decrypt | Separate production resources; no database-owner secret |
| Migration execution role | Same resources plus exact database-owner secret | Keep owner access confined to one-off migration; never inject it into service |
| Existing staging app execution role | Existing app secrets plus only new flow seed/status secret and image pull permission | Grant exact new production flow/status resources to the verified production execution role |
| Production application roles | Different from staging; not modified | Reconcile existing grants before adding scoped production permissions |

ECR authorization-token permission uses Resource=*; repository layer/image reads
are scoped. No general secrets wildcard was observed in these inspected policies.
This is policy inspection, not a full IAM effective-permission simulation or an
assessment of every resource-based policy/SCP. No secret plaintext was fetched.

## Engineering work still outstanding

The current service is deliberately staging-only. `loadConfig` accepts staging or
synthetic; `stagingContainerEnvironment` rejects production; foundation validation
accepts stage=staging only. Origin, RP ID, OIDC client/redirect, database roles and
operator/migration procedures are staging-bound. The existing image cannot be
made production-ready by changing only the application's provider flag.

A production release needs a separately tested exact trust profile for
accounts.mirrorprogress.com, the verified live application callback, separate
production database/secrets and scoped roles. Preserve staging restrictions and
all enrollment/recovery checks; do not loosen allowlists or relabel staging data.
Inspect and reconcile runtime grants, schema migration and operator procedures as
one reviewed change. The staging application roles must not be reused in production.

A completed deployed user login/callback is still unverified. Rehearsal must prove
explicit issuer/subject-to-canonical-principal mapping, unchanged IDs/memberships,
denied disabled accounts, privileged assurance, logout/revocation and recovery.
Synthetic tests already exist but do not establish actual user enrollment or live
account parity. Verified backups are configured; an actual restore rehearsal and
production rollback artifact retention also need recorded evidence. Do not use
missing historical staging image/revision26 as a rollback artifact.

These are engineering/evidence tasks, not all human blockers. This bounded review
prepares them without creating production resources, importing accounts or sending
email. Production preparation must not be reported complete merely because staging
is healthy or human decisions remain pending.

## Exact human/external dependencies

- Independent reviewer staffing is still unanswered; no reviewer was spawned.
  Reviewer must assess implementation and advisory evidence, not just test totals.
- Real privileged enrollment needs the account holder's mailbox proof and fresh
  passkey ceremony plus independent operator approval. Synthetic automation cannot
  substitute for those actions.
- SES was freshly checked: ProductionAccessEnabled=false, review DENIED,
  EnforcementStatus=HEALTHY. A permitted external enrollment-delivery path is not
  established. Pending delivery-provider choice remains unresolved; no duplicate
  question or enrollment send was issued.

After all required evidence passes, cut over within existing authorization,
preserve isolated Cognito rollback for seven days, and then retire it. No new
blanket permission request is implied by this preparation note.

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

The explicit production profile, separate container/migration/operator entrypoints
and offline infrastructure compiler are now implemented and locally tested. See
[the production candidate](PRODUCTION-CANDIDATE.md) for exact evidence and limits.
This is not deployed production readiness. The corrected image is now published
and deployed to staging with the verified-email token fix; production is unchanged.

Read-only production network/account aggregates and stopped offline synthesis are
now recorded in [production inventory](PRODUCTION-INVENTORY.md). Confidential
reconciliation and protected rollback are recorded in
[production reconciliation](PRODUCTION-RECONCILIATION.md); invited state must be
preserved and revalidated. Separately provisioned resources/credentials, independent
image/code review and production deployment are still outstanding. Do not point the live
app at staging or reuse staging secrets, roles or data. Production application
permissions remain unchanged.

The deployed AWS ordinary synthetic login/callback now passes explicit mapping,
principal/membership/role and precise epoch parity, replay denial, disabled membership
and provider logout/revocation denial. An actual private RDS point-in-time restore
also passed TLS, migration, client and runtime-permission checks. See
[AWS rehearsal evidence](AWS-REHEARSAL.md). These do not establish actual user
onboarding, privileged human assurance, real-account parity or recovery acceptance.
The exact production rollback image is now separately protected and its pull was
verified with the production execution role. Do not use
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

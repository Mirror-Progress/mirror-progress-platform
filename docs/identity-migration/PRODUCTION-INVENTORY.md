# Production inventory and migration preparation — September 23, 2026

Read-only AWS inspection and offline synthesis only. Production remains Cognito
revision43; no production resource, identity, account, routing or email changed.
No account attributes were written to disk, Git or tool output.

## Verified infrastructure

Production VPC is `vpc-0b4539693ad6a5506`, distinct from staging. AZ order below is
us-east-1a, us-east-1b:

| Purpose | Subnets | Verified routing |
| --- | --- | --- |
| Public ALB | subnet-05b254be3c54a0f6f, subnet-026a93594898f7346 | Active internet gateway, 10.0.0.0/24 and 10.0.1.0/24 |
| Private application | subnet-080c7c7a70c2d1ea0, subnet-005739355cb181ddb | Active NAT nat-0300b06920607151c; no public IP assignment |
| Isolated database | subnet-0f5b7d8980ea5af2c, subnet-02602cd113254b6fe | Local route and S3 endpoint only; no default internet route |

NAT is available. Management CloudTrail is multi-region, logging, validates log
files and reports no latest delivery error. PostgreSQL17.11 is available in the
region. The exact production application execution role is
`MirrorProgressPlatform-PlatformTaskExecutionRole666-tNmF7sjz1YHL`; it has one
existing inline policy and no attached policies. No grants were changed.
The accounts.mirrorprogress.com record does not yet exist in the verified zone.

An ignored mode0600 inventory file supplies these verified values to the offline
production compiler. Build and synthesis passed for foundation27 resources,
application integration2 and identity service18. There are no custom resources;
identity DesiredCount is zero. Synthesis is not a CloudFormation change-set review
or deployment. The compiled service references the separate production repository:
the corrected digest must be promoted there and verified before migration/startup.
The service template creates accounts DNS/certificate even at DesiredCount zero;
review that planned change before deployment. Existing platform DNS is untouched.

## Current accounts and confidential reconciliation

A read-only in-memory Cognito enumeration counted three accounts: all three
enabled, confirmed and email-verified. Only aggregates were emitted. These flags
are not new-provider mailbox proof, MFA evidence or canonical mapping acceptance.
No subject, email, name, password, token or MFA material was exported.

The next reconciliation must run within the production network using a bounded
read-only job and emit only counts/failure categories. Match each existing Cognito
subject to the State Kernel's existing cognitoSubject, then verify exactly one
canonical principal, its tenant/workspace, status, epoch, memberships and current
policy head. Identify privileged roles from canonical memberships. Reject missing
or duplicate matches, conflicting scope, disabled accounts and invalid epochs;
never infer a principal from email or create replacement principal IDs. Include
non-Cognito kernel accounts in the discrepancy count rather than silently dropping
them. This live comparison has now run with collection-scoped find-only access;
see PRODUCTION-RECONCILIATION.md for the aggregate invitation-state discrepancy,
confidentiality boundary and complete temporary-access cleanup.

A reviewed confidential mapping manifest must bind existing principal IDs and
versions to newly enrolled identity subjects, with explicit review references.
Keep it out of Git/logs; preserve every existing membership, role and kernel epoch.
Revalidate account state immediately before applying an import and before cutover.
Do not treat the three-account aggregate or synthetic parity tests as that manifest.
No enrollment messages or runtime mapping imports are prepared for transmission.

## Rollback retention gap resolved

The source repository still has its original any-tag/count30 expiration policy.
The exact production43 image has now been copied to the separate protected
mirror-progress/identity-cutover-rollback repository without changing that policy.
Manifest bytes/digest match; no lifecycle expiration is configured, immutable tags
and scoped deletion/retention-change denials are applied. A private task verified
that the actual production execution role can pull and run the retained image.
See PRODUCTION-RECONCILIATION.md for the exact digest, access boundary and limits.
Retain this copy through at least seven days after the eventual verified cutover.

## Actual next-step dependencies

Engineering still required: invitation-preservation validation, reviewed production
change sets, separate resources/secrets and image promotion, reviewed imports and
production readiness validation. Confidential reconciliation and rollback retention
are now recorded separately with their precise limits. These
have not been replaced by documentation or declared human-only blockers.

Independent reviewer staffing is unanswered. Real privileged enrollment requires
account-holder mailbox proof, fresh passkey ceremony and independent approval.
Permitted external delivery remains unresolved following SES's denied production
access. These prevent completing the reviewed release/enrollment path; no duplicate
question, reviewer agent, provisioning, enrollment message or cutover was initiated.

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
them. No such live DocumentDB reconciliation has run yet.

A reviewed confidential mapping manifest must bind existing principal IDs and
versions to newly enrolled identity subjects, with explicit review references.
Keep it out of Git/logs; preserve every existing membership, role and kernel epoch.
Revalidate account state immediately before applying an import and before cutover.
Do not treat the three-account aggregate or synthetic parity tests as that manifest.
No enrollment messages or runtime mapping imports are prepared for transmission.

## Rollback retention gap

Production43's exact image remains present:
`sha256:51f5531fc85e3284ed4fddc25badb0eb9a7cb7ecfcb5dc7c38897fc916423512`.
The application repository expires images beyond the most recent30 with tagStatus
any. Its existing tag is therefore not a guaranteed retention pin. Before cutover,
copy the exact verified image to separately retained rollback storage or review a
lifecycle-policy change, then verify the resulting manifest and pull permissions.
Merely adding another tag does not fix an any-tag expiration rule. No lifecycle
policy was changed during this read-only preparation. Retain isolated Cognito
rollback for seven days after the eventual cutover.

## Actual next-step dependencies

Engineering still required: confidential live principal/membership reconciliation,
reviewed production change sets, separate resources/secrets and image promotion,
rollback retention, reviewed imports and production readiness validation. These
have not been replaced by documentation or declared human-only blockers.

Independent reviewer staffing is unanswered. Real privileged enrollment requires
account-holder mailbox proof, fresh passkey ceremony and independent approval.
Permitted external delivery remains unresolved following SES's denied production
access. These prevent completing the reviewed release/enrollment path; no duplicate
question, reviewer agent, provisioning, enrollment message or cutover was initiated.

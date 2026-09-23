# Production reconciliation and protected rollback — September 23, 2026

Production authentication/routing remains on revision43, running2 with a COMPLETED
rollout. No end-user account, principal, membership, policy or epoch was changed.

## Exact retained rollback

The production image was copied to a separate KMS-encrypted immutable repository:
`mirror-progress/identity-cutover-rollback:production-cognito-revision43`.
The source and destination manifest bytes match and hash to the same digest:
`sha256:51f5531fc85e3284ed4fddc25badb0eb9a7cb7ecfcb5dc7c38897fc916423512`.
No source images or source lifecycle policies were changed.

The new repository has no lifecycle expiration. Its scoped repository policy denies
DeleteRepository, BatchDeleteImage, PutLifecyclePolicy and PutImageTagMutability.
It grants only image/layer reads to the exact existing production execution role;
that role's existing authorization-token permission is preserved. These are
[repository-scoped permissions](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-policies.html),
not a registry-wide lifecycle change. Administrators capable of changing the
repository policy can remove the protection; do not represent it as immutable WORM
storage. Removing protection requires a deliberate reviewed retirement step after
at least seven days following the eventual verified cutover.

One-off task `3f55fdab8e244c83988d5fadfaa30ede` successfully pulled this exact image
using the real production execution role and printed its non-application smoke
result. No session/database secrets were injected; the application server was not
started. This proves the retained artifact is pullable, not that production routing
has been switched or rolled back. A future rollback task definition can point to
this retained URI with otherwise preserved production settings.

## Confidential least-privilege comparison

The documented existing platform/compiler DB users have readWrite roles, so they
were not used for the account comparison. A one-off private Fargate job instead
creates a temporary custom database role with only find on these three collections:
authorization_principals, authorization_memberships, authorization_policy_heads.
It creates a random-password login bound only to that role, verifies the exact
privileges, then uses a separate connection under that login for all account reads.
This follows [DocumentDB collection-level RBAC](https://docs.aws.amazon.com/documentdb/latest/devguide/role_based_access_control.html).

The injected administrative credential is confined to temporary role/login creation,
permission inspection and removal. It is never used to query account collections.
It is not retrieved to the local machine or logged. The temporary ECS execution
role receives only the exact master secret, required KMS decrypt, image and log
permissions. The separate task role can only ListUsers on the exact production
Cognito pool. Existing application roles and database users are unchanged.

Cognito and database records remain only in memory. Database projection excludes
names/email and reads are bounded to1000 documents per collection. Output consists
only of counts and fixed discrepancy categories. No account manifest, subject, ID,
email, password or token is exported. The comparison checks one-to-one subjects,
canonical IDs/scopes/status/safe epochs, active memberships/roles, policy heads,
unmatched principals and orphan/cross-scope memberships. Four synthetic unit tests
cover valid parity, duplicates/missing subjects, unsafe epochs/disabled memberships,
and non-Cognito/cross-scope discrepancies without exposing identifiers.

The initial job stopped during the role-verification assertion before reading any
account collections, and removed its temporary login and role. The final check
compares permission sets without depending on the server's privilege ordering.

## Observed aggregate result and cleanup

Final job3652b5f911c143f885ee3f56b6402ce4 exited zero with a completed comparison:
three Cognito accounts, three canonical principals, three unique subject matches.
There were no missing/ambiguous mappings, unmatched principals, missing/ambiguous
memberships, orphan/cross-scope memberships, missing/ambiguous/invalid policy heads,
unsafe epochs, invalid roles or missing identifiers/scopes. One valid active
membership was classified privileged; that is not a count of privileged invited
accounts because the active-readiness check excludes invited memberships.

The strict all-active readiness result is **false**: exactly one principal and one
membership are invited. No principal/membership is disabled or has an unknown
status. Preserve these invitation states; do not activate them to make a migration
check green. The account migration must distinguish the active enrollment cohort
from pending invitation acceptance and verify that existing acceptance behavior
survives. No new-provider subject mapping or enrollment was created by this check.

Reads were bounded and sequential, not a transactionally consistent cross-service
snapshot. Revalidate all states/epochs immediately before import and cutover. This
is confidential reconciliation evidence, not an approval to migrate all accounts.

All four one-off tasks stopped. Reconciliation definitions1–3 and pull-check1 were
deregistered. Both temporary IAM roles and their inline policies were deleted.
Each reconciliation attempt reported removal of its temporary database login/role.
No security-group rules or existing role policies changed. The protected rollback
repository and its narrow production pull grant intentionally remain.

The final reconciliation worker digest is
`sha256:27cf653723b62987cfa68d88db966ac9a55408c65d3c36550094e7d61735b8f8`.
Scan completed: zero critical, two high, one medium, one low, consistent with its
pinned application base and the existing bounded advisory review. This is not
independent approval. Real reviewer staffing, permitted delivery and privileged
human enrollment/approval remain unresolved, alongside production provisioning,
reviewed imports and invitation-preservation validation.

# Isolated AWS rehearsal — September 23, 2026

Production remains on application revision43/Cognito. This rehearsal uses the
isolated staging PostgreSQL and DocumentDB database `mirror_identity_rehearsal`.
No real account mapping, human enrollment or enrollment email was performed.

## Published correction

Identity tag `identity-staging-8464ab6` is pinned to
`sha256:dcac3d887942400a607260e820e9099332259ebaf14ea5765121e5bdfabafca1`.
CloudFormation completed its update to identity runtime/migration revision2;
the runtime has one running task and a COMPLETED rollout. Only task definitions
and the identity service changed. The database was not replaced.

ECR completed scanning: zero critical, two high, one medium, one low. See
IMAGE-ADVISORY-REVIEW.md for bounded applicability evidence, which does not
constitute independent approval or a finding-free image.

## Actual RDS point-in-time restore

A private encrypted disposable clone was restored from the staging foundation's
latest restorable time. One-off task `659c7b58d3b1463c9f8bc00be5b327bc` exited zero
and verified trusted TLS, all three migration checksums, OAuth client configuration
parity, and preserved denial of runtime schema creation/recovery approval.
Migration digest: `cc6b6aa4f0ef00fe3c898ebadb9e7c71c2920bad2afe6b3d11a6c0d4a9d335b6`.
This is schema/configuration/permission restore evidence, not real-account recovery
acceptance. The clone predates the synthetic callback fixtures.

## Callback runner and evidence boundaries

`identity/rehearsal/aws-staging.mjs` runs as an explicit one-off private Fargate task.
Its pinned images supply the corrected identity runtime and the tested app's Mongo
client dependencies. It asserts exact staging hosts/database and absence of real
principals before creating a uniquely named ordinary synthetic identity. It uses
real HTTPS mailbox/enrollment, password/TOTP, OAuth and application routes, with an
explicit fake mailbox sink that sends no email. Its cleanup disables the exact
synthetic principal/mapping, revokes its sessions and drops its temporary DB login.
Logs include only outcome, phase and safe numeric assertion details.

Initial attempts stopped at provider authorization: Node fetch sent Sec-Fetch-Mode
cors, which makes Better Auth return its JSON redirect representation. Setting a
header alone failed because Node overwrote it. The final runner explicitly sets
fetch mode to same-origin, selecting the provider's HTTP redirect branch. No
provider security gate or application callback was weakened to address this test
transport issue.

Final task `2a7d8d8e3cba48b488f01a4e1a56fee2` exited zero using worker digest
`sha256:54b03b755b0e9784102c05a17399810b1794c28e73ec3325c619bc2861b80324`.
It passed the actual application callback and session lookup, preserved principal,
membership, client role, kernel epoch7 and exact provider epoch9007199254740993,
denied callback replay, denied disabled membership, and denied the session after
actual provider global logout. Synthetic cleanup completed. All preceding failed
attempts also disabled their fixtures and removed their temporary operator login.
This proves the ordinary synthetic path, not a real privileged passkey ceremony.

## Cleanup

All five jobs stopped; the disposable task definitions1–4 were deregistered.
The temporary execution role and its inline policy were deleted. The restore clone
was deleted and confirmed absent. The temporary NAT /32 was removed from the
application ALB security group and WAF; original access entries were preserved.
The existing staging app was returned to the verified Cognito rollback revision29.
Production revision43 remained running2/desired2 throughout. The corrected staging
identity runtime2 remains available for subsequent explicitly scoped validation.

Real delivery, privileged human enrollment and approval, independent review, and
separate production inventory/provisioning/account migration remain outstanding.

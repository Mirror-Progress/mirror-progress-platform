# Read-only AWS staging inventory — September 22, 2026

Existing credentials succeeded for account 380314682150 in us-east-1. No login,
resource creation, deployment, secret retrieval, email send or production mutation
was performed. This supersedes earlier expired-credential notes.

## Verified resources

- Staging VPC: `vpc-05d4779e3d841ca2d`, 10.0.0.0/16.
- Application private subnets: `subnet-0b47d0854d81d2142` (us-east-1a),
  `subnet-0bf3cad7147dce01b` (us-east-1b).
- Isolated data subnets: `subnet-02b1377a7fd9ed705` (us-east-1a),
  `subnet-054a4ac95c78dd159` (us-east-1b).
- Public ingress subnets: `subnet-0f500f037def53793` (us-east-1a),
  `subnet-09542b160134e4415` (us-east-1b).
- Both application subnet routes use active NAT `nat-0800e2073dbe1ee03`.
  Isolated data subnet routes have no internet default route.
- S3 gateway endpoint `vpce-0195956f54d54c70a`, prefix list `pl-63a5400a`.
- Staging management CloudTrail is logging, with no returned delivery errors;
  selectors include all management events. Log group:
  `/mirror-progress-security-staging/audit`.
- Public hosted zone `mirrorprogress.com.`: `Z0789473A6S6HO6JIQO1`.
  This does not establish that proposed account hostnames have DNS or certificates.
- PostgreSQL 17.11 is listed as available in this region. Pin and recheck the minor
  immediately before deployment; offline fixture 17.6 is only a test input.
- No Identity ECR repository exists yet.
- SES sending is enabled but production access remains false and review DENIED.
  Verified-domain status is not evidence of ordinary recipient delivery.
- Production platform service remains on task revision 43, desired/running 2/2,
  rollout COMPLETED. No production stack update occurred.

## Resulting infrastructure constraint

The foundation now requires two distinct isolated database subnet IDs, disjoint
from its application subnet IDs. Offline synthesis checks the RDS subnet group
uses exactly those isolated subnets. Actual VPC membership, route and AZ evidence
must be refreshed before deployment; identifier validation alone cannot establish
network isolation.

The foundation remains an undeployed candidate. TLS/ALB compatibility, trusted
proxy address handling, readiness routing, service/migration task separation,
secret rotation, recovery and restore rehearsal, real enrollment delivery, human
privileged enrollment and independent review are still open. Do not apply the
obsolete platform stack to install it.

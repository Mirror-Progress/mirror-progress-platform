# Staging transport and container rehearsal

September 23, 2026: service builds and 138 unit tests pass. Five CDK synthesis
checks pass, including both stacks together to detect cross-stack dependency cycles.

The disposable local container rehearsal runs PostgreSQL with certificate-verified
TLS, applies the actual staging migration executable twice, starts the actual
non-root/read-only runtime executable, and checks private readiness, authentication
Host/proxy restrictions and a request from the simulated ALB subnet. All checks pass.
The runner removes its own containers, network and synthetic certificate directory.
It calls no AWS APIs and creates no real principal or enrollment message.

Command: `node identity/scripts/test-container-staging.mjs` after building the
`mirror-identity:local-alb-reviewed` image. Synthetic database certificates and test
backend TLS inspection are confined to this runner. Deployed RDS verification
remains enabled; the public AWS RDS CA bundle SHA-256 is
`e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3`, obtained from
https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem.

ALB forwarding requires two explicitly configured private subnet ranges. Only the
immediate trusted peer may supply forwarding data, HTTPS/443 is required, and the
last address in ALB append mode is used for throttling. An attacker-supplied prefix
cannot select that address. The ALB security group is the only allowed task ingress.
The separate health port cannot dispatch authentication requests.

The live foundation change set passed AWS template validation and contains only
27 additions, with no replacements or existing-resource changes. Its early validation
reported no failed events. This is deployment planning evidence, not deployed sign-in
proof. Production and Cognito remain unchanged.

## Runtime and rollout check

Both service and application images now use Node 24.21.0 on Debian 13 (trixie),
pinned to official image index
`sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe`.
Service unit tests run in the image build before pruning development dependencies.
Actual runtime reports OpenSSL 3.5.8. Local TLS database/container rehearsal passes
again. The built app passes both Mirror and Cognito route-switch probes with the
same authoritative authorization settings as the current deployments; this is a
local routing check, not a completed AWS user-login or rollback rehearsal.

The upgraded identity image's ECR scan reports zero critical, two high, one medium
and one low finding. This is not a clean scan or independent review. High
[CVE-2026-82560](https://security-tracker.debian.org/tracker/CVE-2026-82560) affects
Perl Pod::Text; a probe confirms that module is absent in the identity runtime.
High [CVE-2026-85091](https://security-tracker.debian.org/tracker/CVE-2026-85091)
concerns zlib non-blocking gzwrite/gzprintf behavior; Debian lists the package
unfixed. The identity service does not intentionally expose those APIs, but final
app/native-library applicability review remains open. No scanner finding was
suppressed or represented as remediated solely because it appears unreachable.

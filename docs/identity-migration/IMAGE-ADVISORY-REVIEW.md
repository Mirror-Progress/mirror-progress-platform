# Image advisory applicability evidence

September 23, 2026. Implementer evidence for independent review, not release approval.
No findings were suppressed. No image, deployment or package was modified in this review.

## Exact artifacts

Docker RepoDigests match the ECR artifacts actually rehearsed:

- Identity: `sha256:d9d7ade8955959c496be5cd607e02e23ba7d7b69b6f00d115bea51c07db0fdea`.
- Application: `sha256:eb2b2bd5381b67c7f5bba5455afaa1168357cfed0b8d2bed254edcdb409d170b`.

ECR reports zero critical, two high, one medium and one low finding. Both images
report Node 24.21.0, OpenSSL 3.5.8, bundled zlib 1.3.2.1-motley-8002e91,
Debian zlib1g 1:1.3.dfsg+really1.3.1-1+b1, perl-base 5.40.1-6+deb13u1,
and libc6 2.41-12+deb13u4. Local probes used network-none, read-only containers
with all capabilities dropped and no-new-privileges. Those probe flags are not
claims about the existing application ECS task hardening.

## High findings

**CVE-2026-82560:** Debian describes a denial of service in Pod::Text when formatting
hostile POD input ([Debian advisory](https://security-tracker.debian.org/tracker/CVE-2026-82560)).
`perl -MPod::Text -e 1` fails with module-not-found in both exact images. The
installed binary package is perl-base. Assessment: affected module is absent in
these artifacts. This does not mean every module in the Perl source package was
patched or that a future image installing more Perl packages remains unaffected.

**CVE-2026-85091:** the upstream repair concerns state retained after non-blocking
gzwrite failure ([upstream patch](https://github.com/madler/zlib/commit/df84af25dc1942490e1d1c899a07619152a46148)).
[Debian still flags the installed source package](https://security-tracker.debian.org/tracker/CVE-2026-85091).
Do not dismiss that database result solely from the upstream version range.

Evidence narrowing application exposure:

- `ldd /usr/local/bin/node` in both images does not link system libz.so.
- Identity node_modules contains no .node native addon.
- The application contains Sharp and SWC native addons. Their dependency listings,
  including libvips-cpp, do not link system libz.so.
- Sharp reports bundled zlib-ng 2.3.3, not the Debian package.
- A real Sharp PNG encode followed by Node gzip succeeds; `/proc/self/maps` after
  those operations contains the expected Sharp/libvips libraries and no libz.so.
- The reviewed service/app source contains no direct gzwrite/gzprintf call. The app
  has a separate subprocess helper for pdftotext; this inspection is not a proof
  about every possible subprocess or unexercised native-library code path.

Assessment: no reachable use of the flagged **system** library was demonstrated in
the inspected authentication/compression/image paths. This is bounded negative
reachability evidence, not universal non-exploitability or a patch. Independent
review must decide disposition for system and bundled libraries separately.

## Other findings and limits

ECR also reports CVE-2026-86805 (medium) and CVE-2026-95818 (low) against glibc,
with setuid/setgid loader prerequisites in its descriptions. The application
image retains setuid/setgid utilities. The local probe kernel reports
fs.protected_hardlinks=1; that is **not** verified evidence for AWS Fargate's host
kernel. No exploit was run. Applicability remains unresolved; do not claim these
findings mitigated by local-only flags. Runtime identity ECS is explicitly UID1000,
read-only with all capabilities dropped; existing application task definitions do
not provide equivalent explicit controls. Its image default user is UID1001.

Reproduce with read-only `docker image inspect`, container `dpkg-query`,
`perl -MPod::Text -e 1`, `ldd`, `require("sharp").versions`, and `/proc/self/maps`
after actual compression. No credentials or account data are needed.

# Isolated application integration candidates

These files were implemented and tested against the verified deployed application
archive documented in `../BASELINE.md`, not the obsolete root `client/` checkout.
They are stored with `.txt` suffixes to avoid accidentally including them in that
checkout's build. Copy to the matching paths without `.txt` only when integrating
into the verified application release. They do not activate authentication routes.

## Shared callback replay gate

The MongoDB adapter implements the bridge's `ConsumeFlow` interface: a unique
hashed key, atomic insert, majority acknowledgement, explicit expiry and fail-closed
database errors. TTL removes expired records but never determines authorization.
No authorization code, browser state, access token or credential is stored.

Six integration tests passed on isolated MongoDB 7 with the application's actual
MongoDB 7.2 driver: concurrent consumers, independent flows, invalid inputs,
abort/storage failure, expiry during a committed write and abort acquiring storage.
The application passes typechecking. The adapter is not wired to the callback yet.
Cloud DocumentDB compatibility, IAM/network configuration and staging remain open.

Separately, the isolated release's dependency-update candidate pins Next and
eslint-config-next 15.5.26, nodemailer 9.1.1, and overrides postcss 8.5.28 and sharp
0.35.4. Its registry-resolved lock, full application source and build remain in the
isolated local candidate; no private release data is published here. Full build,
13 existing authorization tests, image codec smoke tests and production npm audit
(zero reported vulnerabilities) passed. This is not a deployed release.

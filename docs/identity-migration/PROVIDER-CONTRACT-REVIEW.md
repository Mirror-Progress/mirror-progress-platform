# Provider contract integration review

Reviewed 2026-09-21. This is a blocking compatibility finding, not cutover evidence.

The proposed bridge requires custom standard `acr`/`amr` values and interprets
`auth_time` as completed MFA time. That contract must not be assumed compatible
with the selected Better Auth OAuth provider.

Official provider documentation currently states:

- Custom ID-token claims cannot override reserved `auth_time`, `acr` or `amr`.
- The provider advertises only ACR `0`; custom ACR policies are unsupported.
- An essential ACR request excluding `0` fails.

Source: https://better-auth.com/docs/plugins/oauth-provider (Claims and Advertised
Metadata sections). Confirm these behaviors against the pinned installed package
and real integration tests; documentation alone is not executable evidence.

The registry tarball for `@better-auth/oauth-provider@1.7.5` was downloaded and
inspected locally (SHA-256
`9ec52a71ed89a45fcb2c47e686c91b23fa4a01d403ecf842246989fa46e6e212`).
Its `createIdToken` implementation sets `acr: "0"` and filters custom reserved
claims. Its type declarations show that `customIdTokenClaims` receives user,
scopes and client metadata, but no session identifier. Do not look up the user's
latest MFA record there: that could mix evidence across simultaneous sessions.

The supported `OAuthProviderExtension.claims.idToken` callback DOES receive a
possibly absent `sessionId`, plus user, client and grant type. This is the
candidate integration point for a namespaced ceremony claim. Missing session,
deleted/unlinked session or missing durable evidence must fail closed. Both
authorization-code and refresh behavior require real provider tests.

## Required resolution

Do not weaken the bridge to accept `acr=0` as MFA proof, overwrite reserved claims,
stamp callback time as MFA time, or patch maintained protocol internals casually.

An implementation candidate is a versioned, issuer-owned namespaced signed claim
containing verified ceremony evidence. Its values must be resolved server-side
from durable evidence bound to the actual authenticated session and authorization
transaction, never from user metadata or browser-submitted assertions. The bridge
must verify its exact schema, method, freshness and binding independently of the
provider's standard ACR, while retaining all normal OIDC validation.

This candidate still requires implementation review and tests covering initial
registration versus assertion, TOTP completion, SSO reuse, refresh, recovery,
revocation, cross-session substitution and administrator passkey requirements.
Do not treat a custom claim or an enabled-factor flag alone as proof.

The separately generated identity service and bridge have not yet been reconciled.
Neither can be integrated or deployed on the basis of standalone unit tests.

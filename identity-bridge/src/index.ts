// Node-only export condition and node:crypto keep this library out of browser/Edge code.
export { createIdentityBridge } from './client.js';
export { IdentityBridgeError } from './errors.js';
export type { IdentityBridgeErrorCode } from './errors.js';
export { pagesCookieResponse } from './pages-router.js';
export type { PagesHeaderResponse } from './pages-router.js';
export { safeReturnTo } from './validation.js';
export type {
  AssurancePolicy,
  AuthorizationCallback,
  AuthorizationStart,
  BeginAuthorizationRequest,
  BridgeDependencies,
  ConsumeFlow,
  CookieResponse,
  Fetch,
  Identity,
  IdentityBridge,
  OidcClientConfig,
  SigningAlgorithm,
  VerificationContext,
  VerifiedAssurance,
} from './types.js';

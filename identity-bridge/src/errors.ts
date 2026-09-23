export type IdentityBridgeErrorCode =
  | 'configuration_invalid'
  | 'request_invalid'
  | 'return_to_invalid'
  | 'callback_invalid'
  | 'flow_invalid'
  | 'flow_expired'
  | 'state_mismatch'
  | 'flow_replayed'
  | 'authorization_denied'
  | 'discovery_invalid'
  | 'token_exchange_failed'
  | 'identity_token_invalid'
  | 'assurance_insufficient'
  | 'authentication_stale'
  | 'dependency_unavailable';

/** Safe to classify. Never carries tokens, provider descriptions, secrets, or raw causes. */
export class IdentityBridgeError extends Error {
  readonly code: IdentityBridgeErrorCode;

  constructor(code: IdentityBridgeErrorCode) {
    super(code);
    this.name = 'IdentityBridgeError';
    this.code = code;
  }
}

export function fail(code: IdentityBridgeErrorCode): never {
  throw new IdentityBridgeError(code);
}

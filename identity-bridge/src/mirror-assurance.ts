import type { JWTPayload } from 'jose';
import type { Config } from './config.js';
import { fail } from './errors.js';
import { boundedString, numericDate } from './validation.js';

export function mirrorAssurance(payload: JWTPayload, config: Config, now: number) {
  const principalId = payload['https://mirrorprogress.com/principal_id'];
  const authorizationEpoch = payload['https://mirrorprogress.com/authorization_epoch'];
  const raw = payload['https://mirrorprogress.com/assurance'];
  if (!boundedString(principalId, 255) || typeof authorizationEpoch !== 'string' ||
      !/^(0|[1-9][0-9]{0,18})$/.test(authorizationEpoch) || BigInt(authorizationEpoch) > 9223372036854775807n ||
      !raw || typeof raw !== 'object' || Array.isArray(raw)) fail('assurance_insufficient');
  const evidence = raw as Record<string, unknown>;
  const keys = ['version', 'session_id', 'method', 'verified_at', 'password_verified_at', 'expires_at'];
  if (Object.keys(evidence).length !== keys.length || Object.keys(evidence).some(k => !keys.includes(k)) ||
      evidence.version !== 1 || !boundedString(evidence.session_id, 255) ||
      !numericDate(evidence.verified_at) || !numericDate(evidence.expires_at) ||
      !numericDate(payload.iat) || evidence.verified_at > payload.iat || evidence.verified_at > now ||
      evidence.expires_at <= evidence.verified_at || evidence.expires_at - evidence.verified_at > 3600 ||
      (payload.sid !== undefined && payload.sid !== evidence.session_id)) fail('assurance_insufficient');
  if (evidence.expires_at <= now || now - evidence.verified_at >= config.maxAuthenticationAgeSeconds) fail('authentication_stale');
  let kind: 'passkey-uv' | 'pwd-otp';
  if (evidence.method === 'passkey_uv') {
    if (evidence.password_verified_at !== null) fail('assurance_insufficient');
    kind = 'passkey-uv';
  } else if (evidence.method === 'password_totp') {
    if (!numericDate(evidence.password_verified_at) || evidence.password_verified_at > evidence.verified_at ||
        evidence.verified_at - evidence.password_verified_at >= 300) fail('assurance_insufficient');
    kind = 'pwd-otp';
  } else fail('assurance_insufficient');
  return { principalId, authorizationEpoch, identitySessionId: evidence.session_id,
    authTime: evidence.verified_at, amr: Object.freeze([] as string[]), assurance: Object.freeze({ kind, acr: null }) };
}

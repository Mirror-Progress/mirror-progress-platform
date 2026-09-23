import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Config } from './config.js';
import { fail } from './errors.js';
import type { CookieResponse } from './types.js';
import { constantTimeEqual, decodeBase64Url, isRandomValue, numericDate, parseJsonObject, safeReturnTo, utf8 } from './validation.js';

export interface Flow {
  readonly version: 1;
  readonly state: string;
  readonly nonce: string;
  readonly verifier: string;
  readonly issuer: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly returnTo: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export function cookieName(config: Config, state: unknown): string {
  if (!isRandomValue(state)) fail('state_mismatch');
  return `${config.cookiePrefix}${state}`;
}

function mac(config: Config, state: string, encoded: string): Buffer {
  return createHmac('sha256', config.flowCookieSecret)
    .update(`identity-bridge:flow:v1\0${config.fingerprint}\0${cookieName(config, state)}\0${encoded}`)
    .digest();
}

export function createFlow(config: Config, returnTo: string, now: number): Flow {
  return {
    version: 1,
    state: randomBytes(32).toString('base64url'),
    nonce: randomBytes(32).toString('base64url'),
    verifier: randomBytes(48).toString('base64url'),
    issuer: config.issuer,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    returnTo,
    issuedAt: now,
    expiresAt: now + config.flowTtlSeconds,
  };
}

export function sealFlow(config: Config, flow: Flow): string {
  const encoded = Buffer.from(JSON.stringify(flow), 'utf8').toString('base64url');
  const value = `v1.${encoded}.${mac(config, flow.state, encoded).toString('base64url')}`;
  if (value.length > 3500) fail('configuration_invalid');
  return value;
}

export function openFlow(config: Config, state: string, value: string | undefined, now: number): Flow {
  if (typeof value !== 'string' || value.length === 0 || value.length > 3500) fail('flow_invalid');
  const parts = value.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) fail('flow_invalid');
  const encoded = parts[1];
  const signature = decodeBase64Url(parts[2], 'flow_invalid', 32);
  if (signature.length !== 32 || !timingSafeEqual(signature, mac(config, state, encoded))) fail('flow_invalid');
  const bytes = decodeBase64Url(encoded, 'flow_invalid', 2600);
  const text = utf8(bytes, 'flow_invalid');
  const payload = parseJsonObject(text, 'flow_invalid');
  const keys = ['version', 'state', 'nonce', 'verifier', 'issuer', 'clientId', 'redirectUri', 'returnTo', 'issuedAt', 'expiresAt'];
  if (Object.keys(payload).length !== keys.length || !keys.every((key) => Object.hasOwn(payload, key)) || text !== JSON.stringify(payload)) fail('flow_invalid');
  if (payload.version !== 1 || !isRandomValue(payload.state) || !isRandomValue(payload.nonce) || !isRandomValue(payload.verifier, 48) ||
      payload.issuer !== config.issuer || payload.clientId !== config.clientId || payload.redirectUri !== config.redirectUri ||
      typeof payload.returnTo !== 'string' || !numericDate(payload.issuedAt) || !numericDate(payload.expiresAt) ||
      payload.issuedAt > now || payload.expiresAt !== payload.issuedAt + config.flowTtlSeconds) fail('flow_invalid');
  if (!constantTimeEqual(payload.state, state)) fail('state_mismatch');
  if (payload.expiresAt <= now) fail('flow_expired');
  try { safeReturnTo(payload.returnTo); } catch { fail('flow_invalid'); }
  return payload as unknown as Flow;
}

export function writeFlowCookie(config: Config, response: CookieResponse, state: string, value: string, clear = false): void {
  const header = `${cookieName(config, state)}=${value}; Path=/; Max-Age=${clear ? 0 : config.flowTtlSeconds}; HttpOnly${config.secureCookies ? '; Secure' : ''}; SameSite=Lax${clear ? '; Expires=Thu, 01 Jan 1970 00:00:00 GMT' : ''}`;
  if (header.length > 4096) fail('configuration_invalid');
  try { response.appendSetCookie(header); } catch { fail('dependency_unavailable'); }
}

export function readFlowCookie(config: Config, header: string | undefined, state: unknown): string | undefined {
  const name = cookieName(config, state);
  if (header === undefined) return undefined;
  if (typeof header !== 'string' || header.length > 32768 || /[\u0000-\u001f\u007f-\u009f]/u.test(header)) fail('flow_invalid');
  let found: string | undefined;
  for (const raw of header.split(';')) {
    const part = raw.replace(/^ +/u, '');
    const equal = part.indexOf('=');
    if (equal < 0) { if (part === name) fail('flow_invalid'); continue; }
    if (part.slice(0, equal) !== name) {
      if (part.slice(0, equal).trim() === name) fail('flow_invalid');
      continue;
    }
    if (found !== undefined) fail('flow_invalid');
    found = part.slice(equal + 1);
    // No percent decoding, quoted cookies, legacy fallback, or duplicate-name ambiguity.
    if (!/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/u.test(found) || found.length > 3500) fail('flow_invalid');
  }
  return found;
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

export function replayKey(config: Config, state: string): string {
  return `identity-bridge:v1:${createHash('sha256').update(`${config.fingerprint}\0${state}`).digest('base64url')}`;
}

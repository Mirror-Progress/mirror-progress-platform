import { createHash } from 'node:crypto';
import { fail } from './errors.js';
import { boundedString } from './validation.js';
import type { AssurancePolicy, OidcClientConfig, SigningAlgorithm } from './types.js';
import type { IdentityBridgeErrorCode } from './errors.js';

export interface Config {
  readonly issuer: string;
  readonly discoveryUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
  readonly redirectUri: string;
  readonly callbackPath: string;
  readonly endpointOrigins: readonly string[];
  readonly idTokenAlgorithms: readonly SigningAlgorithm[];
  readonly additionalTrustedAudiences: readonly string[];
  readonly flowCookieSecret: Buffer;
  readonly assurance: AssurancePolicy;
  readonly acrValues: readonly string[];
  readonly maxAuthenticationAgeSeconds: number;
  readonly flowTtlSeconds: number;
  readonly maxIdTokenLifetimeSeconds: number;
  readonly requestTimeoutMs: number;
  readonly allowInsecureLocalhost: boolean;
  readonly cookiePrefix: string;
  readonly secureCookies: boolean;
  readonly fingerprint: string;
}

export function serverUrl(value: unknown, allowHttp: boolean, code: IdentityBridgeErrorCode, issuer = false): URL {
  if (typeof value !== 'string' || value.length === 0 || value.length > 1024 || /[\u0000-\u0020\u007f-\uffff\\%?#]/u.test(value)) fail(code);
  let url: URL;
  try { url = new URL(value); } catch { fail(code); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(allowHttp && loopback && url.protocol === 'http:')) fail(code);
  if (url.username || url.password || url.search || url.hash || url.pathname.includes('//')) fail(code);
  // Reject URL-parser rewrites (dot segments, shorthand IPs, ports, casing, backslashes, etc.).
  if (url.href !== value && !(issuer && url.pathname === '/' && url.origin === value)) fail(code);
  return url;
}

function strings(value: unknown, maxItems: number, maxLength: number, allowEmpty = false): readonly string[] {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0) || !value.every((v: unknown) => boundedString(v, maxLength))) fail('configuration_invalid');
  const copy = value as string[];
  if (new Set(copy).size !== copy.length) fail('configuration_invalid');
  return Object.freeze([...copy]);
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  const selected = value === undefined ? fallback : value;
  if (typeof selected !== 'number' || !Number.isSafeInteger(selected) || selected < min || selected > max) fail('configuration_invalid');
  return selected;
}

function assurancePolicy(input: AssurancePolicy): { policy: AssurancePolicy; acrValues: readonly string[] } {
  if (!input || typeof input !== 'object') fail('configuration_invalid');
  if (input.mirrorV1 !== undefined) {
    if (input.mirrorV1 !== true || Object.keys(input).length !== 1) fail('configuration_invalid');
    return { policy: Object.freeze({ mirrorV1: true }), acrValues: Object.freeze([]) };
  }
  const policy: { passkeyUv?: NonNullable<AssurancePolicy['passkeyUv']>; passwordOtp?: NonNullable<AssurancePolicy['passwordOtp']> } = {};
  const acrValues: string[] = [];
  if (input.passkeyUv) {
    const { methodAmr, userVerificationAmr } = input.passkeyUv;
    const forbidden = new Set(['pwd', 'otp', 'mfa', 'email', 'registered', 'passkey_registered', 'webauthn_registered']);
    if (![methodAmr, userVerificationAmr].every((v) => boundedString(v, 64) && !forbidden.has(v)) || methodAmr === userVerificationAmr) fail('configuration_invalid');
    const values = strings(input.passkeyUv.acrValues, 8, 256);
    policy.passkeyUv = Object.freeze({ acrValues: values, methodAmr, userVerificationAmr });
    acrValues.push(...values);
  }
  if (input.passwordOtp) {
    const values = strings(input.passwordOtp.acrValues, 8, 256);
    policy.passwordOtp = Object.freeze({ acrValues: values });
    acrValues.push(...values);
  }
  // Ambiguous contexts are not allowed to silently select the stronger profile.
  if (!acrValues.length || new Set(acrValues).size !== acrValues.length) fail('configuration_invalid');
  return { policy: Object.freeze(policy), acrValues: Object.freeze(acrValues) };
}

export function validateConfig(input: OidcClientConfig): Config {
  try {
    if (!input || typeof input !== 'object') fail('configuration_invalid');
    if (input.allowInsecureLocalhost !== undefined && typeof input.allowInsecureLocalhost !== 'boolean') fail('configuration_invalid');
    const allowHttp = input.allowInsecureLocalhost === true;
    if (allowHttp && process.env.NODE_ENV === 'production') fail('configuration_invalid');
    const issuer = serverUrl(input.issuer, allowHttp, 'configuration_invalid', true);
    const configuredOrigins = strings(input.endpointOrigins ?? [], 8, 1024, true);
    for (const origin of configuredOrigins) {
      const url = serverUrl(origin, allowHttp, 'configuration_invalid', true);
      if (origin !== url.origin) fail('configuration_invalid');
    }
    const endpointOrigins = Object.freeze([...new Set([issuer.origin, ...configuredOrigins])]);
    const discovery = serverUrl(input.discoveryUrl, allowHttp, 'configuration_invalid');
    if (!endpointOrigins.includes(discovery.origin)) fail('configuration_invalid');
    const allowed = strings(input.allowedRedirectUris, 8, 1024);
    for (const uri of allowed) serverUrl(uri, allowHttp, 'configuration_invalid');
    if (!allowed.includes(input.redirectUri)) fail('configuration_invalid');
    const redirect = serverUrl(input.redirectUri, allowHttp, 'configuration_invalid');
    if (redirect.pathname === '/') fail('configuration_invalid');
    if (!boundedString(input.clientId, 128)) fail('configuration_invalid');
    if (input.tokenEndpointAuthMethod === 'none') {
      if (input.clientSecret !== '' || input.assurance?.mirrorV1 !== true) fail('configuration_invalid');
    } else {
      if (typeof input.clientSecret !== 'string' || Buffer.byteLength(input.clientSecret) < 32 || Buffer.byteLength(input.clientSecret) > 4096 || /[\u0000-\u001f\u007f-\u009f]/u.test(input.clientSecret)) fail('configuration_invalid');
      if (input.tokenEndpointAuthMethod !== 'client_secret_basic' && input.tokenEndpointAuthMethod !== 'client_secret_post') fail('configuration_invalid');
    }
    if (!(input.flowCookieSecret instanceof Uint8Array) || input.flowCookieSecret.length < 32 || input.flowCookieSecret.length > 64 || new Set(input.flowCookieSecret).size < 8) fail('configuration_invalid');
    const algorithms = strings(input.idTokenAlgorithms, 4, 16);
    if (!algorithms.every((alg) => ['RS256', 'PS256', 'ES256', 'EdDSA'].includes(alg))) fail('configuration_invalid');
    const audiences = strings(input.additionalTrustedAudiences ?? [], 8, 128, true);
    if (audiences.includes(input.clientId)) fail('configuration_invalid');
    const assurance = assurancePolicy(input.assurance);
    const secureCookies = redirect.protocol === 'https:';
    const fingerprint = createHash('sha256').update(JSON.stringify([input.issuer, input.clientId, input.redirectUri])).digest('base64url');
    return Object.freeze({
      issuer: input.issuer,
      discoveryUrl: input.discoveryUrl,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
      redirectUri: input.redirectUri,
      callbackPath: redirect.pathname,
      endpointOrigins,
      idTokenAlgorithms: algorithms as readonly SigningAlgorithm[],
      additionalTrustedAudiences: audiences,
      flowCookieSecret: Buffer.from(input.flowCookieSecret),
      assurance: assurance.policy,
      acrValues: assurance.acrValues,
      maxAuthenticationAgeSeconds: integer(input.maxAuthenticationAgeSeconds, 0, 1, 86400),
      flowTtlSeconds: integer(input.flowTtlSeconds, 600, 60, 600),
      maxIdTokenLifetimeSeconds: integer(input.maxIdTokenLifetimeSeconds, 300, 30, 600),
      requestTimeoutMs: integer(input.requestTimeoutMs, 5000, 50, 15000),
      allowInsecureLocalhost: allowHttp,
      cookiePrefix: secureCookies ? '__Host-mp_oidc_flow_' : 'mp_oidc_dev_flow_',
      secureCookies,
      fingerprint,
    });
  } catch { fail('configuration_invalid'); }
}

export function endpointUrl(value: unknown, config: Config): string {
  const url = serverUrl(value, config.allowInsecureLocalhost, 'discovery_invalid');
  if (!config.endpointOrigins.includes(url.origin)) fail('discovery_invalid');
  return url.href;
}

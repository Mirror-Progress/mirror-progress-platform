import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { JWTVerifyGetKey, JWTPayload } from 'jose';
import { createIdentityBridge, IdentityBridgeError } from '../src/index.js';
import type { ConsumeFlow, CookieResponse, Fetch, OidcClientConfig } from '../src/index.js';

export const NOW = 1_800_000_000;
export const NONCE = Buffer.alloc(32, 7).toString('base64url');
export const ISSUER = 'https://identity.example.test';
export const PASSKEY_ACR = 'urn:example:test:passkey-uv';
export const OTP_ACR = 'urn:example:test:pwd-otp';

export function config(overrides: Partial<OidcClientConfig> = {}): OidcClientConfig {
  return {
    issuer: ISSUER,
    discoveryUrl: `${ISSUER}/.well-known/openid-configuration`,
    clientId: 'synthetic-client',
    clientSecret: 'synthetic-client-secret-only-not-for-production-0123456789',
    tokenEndpointAuthMethod: 'client_secret_basic',
    redirectUri: 'https://app.example.test/api/auth/callback',
    allowedRedirectUris: ['https://app.example.test/api/auth/callback'],
    idTokenAlgorithms: ['ES256'],
    flowCookieSecret: Uint8Array.from({ length: 32 }, (_, i) => i + 1),
    assurance: {
      passkeyUv: { acrValues: [PASSKEY_ACR], methodAmr: 'webauthn', userVerificationAmr: 'uv' },
      passwordOtp: { acrValues: [OTP_ACR] },
    },
    maxAuthenticationAgeSeconds: 3600,
    ...overrides,
  };
}

export function collector() {
  const values: string[] = [];
  const response: CookieResponse = { appendSetCookie(value) { values.push(value); } };
  return { values, response };
}

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

export function hasCode(...codes: string[]) {
  return (error: unknown): boolean => {
    assert.ok(error instanceof IdentityBridgeError);
    assert.ok(codes.includes(error.code), `unexpected error code: ${error.code}`);
    assert.equal(error.message, error.code);
    assert.equal(error.cause, undefined);
    return true;
  };
}

interface Grant { nonce: string; challenge: string; redirectUri: string }

export async function fixture(options: { config?: Partial<OidcClientConfig>; remoteJwks?: boolean; consumeFlow?: ConsumeFlow } = {}) {
  const cfg = config(options.config);
  const clock = { seconds: NOW };
  const keys = await generateKeyPair('ES256', { extractable: true });
  const publicJwk = { ...await exportJWK(keys.publicKey), alg: 'ES256', use: 'sig', kid: 'test-key' };
  const jwks = { keys: [publicJwk] };
  const local = createLocalJWKSet(jwks);
  const calls: { url: string; init: RequestInit }[] = [];
  const grants = new Map<string, Grant>();
  const usedCodes = new Set<string>();
  const consumed = new Set<string>();
  const faults: {
    fetch?: Fetch;
    jwks?: JWTVerifyGetKey;
    consume?: ConsumeFlow;
    tokenClaims: Record<string, unknown>;
    omitClaims: string[];
    tokenResponse?: (token: string) => Response;
  } = { tokenClaims: {}, omitClaims: [] };
  const metadata: Record<string, unknown> = {
    issuer: cfg.issuer,
    authorization_endpoint: `${cfg.issuer}/authorize`,
    token_endpoint: `${cfg.issuer}/token`,
    jwks_uri: `${cfg.issuer}/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    response_modes_supported: ['query'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    id_token_signing_alg_values_supported: ['ES256'],
    scopes_supported: ['openid', 'email'],
    authorization_response_iss_parameter_supported: true,
  };

  function payload(overrides: Record<string, unknown> = {}, omit: readonly string[] = []): Record<string, unknown> {
    const value: Record<string, unknown> = {
      iss: cfg.issuer,
      sub: 'synthetic-subject-123',
      aud: cfg.clientId,
      nonce: NONCE,
      iat: clock.seconds,
      exp: clock.seconds + 120,
      auth_time: clock.seconds - 20,
      amr: ['webauthn', 'uv'],
      acr: PASSKEY_ACR,
      email: 'synthetic@example.test',
      email_verified: true,
      ...overrides,
    };
    for (const claim of omit) delete value[claim];
    return value;
  }

  async function sign(overrides: Record<string, unknown> = {}, omit: readonly string[] = [], header: Record<string, unknown> = {}) {
    return new SignJWT(payload(overrides, omit) as JWTPayload)
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key', typ: 'JWT', ...header })
      .sign(keys.privateKey);
  }

  const form = (value: string) => new URLSearchParams({ v: value }).toString().slice(2);
  const expectedBasic = `Basic ${Buffer.from(`${form(cfg.clientId)}:${form(cfg.clientSecret)}`).toString('base64')}`;
  const defaultFetch: Fetch = async (url, init) => {
    if (url === cfg.discoveryUrl) return json(metadata);
    if (url === `${cfg.issuer}/jwks`) return json(jwks);
    if (url !== `${cfg.issuer}/token`) throw new Error('Unexpected synthetic network request');
    const parameters = new URLSearchParams(String(init.body));
    const code = parameters.get('code') ?? '';
    const grant = grants.get(code);
    const headers = new Headers(init.headers);
    const correctAuth = cfg.tokenEndpointAuthMethod === 'client_secret_basic'
      ? headers.get('authorization') === expectedBasic && !parameters.has('client_secret') && !parameters.has('client_id')
      : !headers.has('authorization') && parameters.get('client_id') === cfg.clientId && parameters.get('client_secret') === cfg.clientSecret;
    const challenge = createHash('sha256').update(parameters.get('code_verifier') ?? '').digest('base64url');
    if (!correctAuth || init.method !== 'POST' || parameters.get('grant_type') !== 'authorization_code' || !grant || usedCodes.has(code) ||
        parameters.get('redirect_uri') !== grant.redirectUri || challenge !== grant.challenge) return json({ error: 'invalid_grant' }, 400);
    usedCodes.add(code);
    const idToken = await sign({ nonce: grant.nonce, ...faults.tokenClaims }, faults.omitClaims);
    return faults.tokenResponse?.(idToken) ?? json({ id_token: idToken, access_token: 'synthetic-access-token', token_type: 'Bearer' });
  };
  const consume: ConsumeFlow = async (key, expiry, signal) => {
    if (faults.consume) return faults.consume(key, expiry, signal);
    if (options.consumeFlow) return options.consumeFlow(key, expiry, signal);
    if (consumed.has(key)) return false;
    consumed.add(key); // Synchronous before await: atomic for THIS TEST ONLY. Never a deployment adapter.
    return true;
  };
  const client = createIdentityBridge(cfg, {
    consumeFlow: consume,
    fetch: async (url, init) => { calls.push({ url, init }); return (faults.fetch ?? defaultFetch)(url, init); },
    now: () => clock.seconds * 1000,
    ...(options.remoteJwks ? {} : { jwks: ((header, token) => faults.jwks ? faults.jwks(header, token) : local(header, token)) as JWTVerifyGetKey }),
  });
  let nextCode = 0;
  async function start(returnTo: unknown = '/workspace') {
    const cookies = collector();
    const authorization = await client.beginAuthorization({ method: 'GET', returnTo }, cookies.response);
    const url = new URL(authorization.authorizationUrl);
    const code = `synthetic-code-${++nextCode}`;
    grants.set(code, {
      nonce: url.searchParams.get('nonce')!,
      challenge: url.searchParams.get('code_challenge')!,
      redirectUri: url.searchParams.get('redirect_uri')!,
    });
    const cookieHeader = cookies.values[0]!.split(';')[0]!;
    const cookie = client.readFlowCookie(cookieHeader, authorization.state)!;
    const rawUrl = `${new URL(cfg.redirectUri).pathname}?${new URLSearchParams({ code, state: authorization.state, iss: cfg.issuer })}`;
    return { authorization, url, code, cookie, cookieHeader, cookies, callback: { method: 'GET', rawUrl } };
  }
  return { cfg, client, clock, calls, faults, metadata, keys, jwks, grants, consumed, usedCodes, payload, sign, start, defaultFetch };
}

/** Synthetic-key-only helper to exercise authenticated but structurally invalid cookie payloads. */
export function resealFlow(cfg: OidcClientConfig, state: string, text: string): string {
  const fingerprint = createHash('sha256').update(JSON.stringify([cfg.issuer, cfg.clientId, cfg.redirectUri])).digest('base64url');
  const prefix = new URL(cfg.redirectUri).protocol === 'https:' ? '__Host-mp_oidc_flow_' : 'mp_oidc_dev_flow_';
  const encoded = Buffer.from(text).toString('base64url');
  const signature = createHmac('sha256', cfg.flowCookieSecret)
    .update(`identity-bridge:flow:v1\0${fingerprint}\0${prefix}${state}\0${encoded}`).digest('base64url');
  return `v1.${encoded}.${signature}`;
}

export function flowPayload(cookie: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cookie.split('.')[1]!, 'base64url').toString('utf8')) as Record<string, unknown>;
}

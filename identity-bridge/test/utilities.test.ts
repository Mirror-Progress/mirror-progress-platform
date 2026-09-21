// Deliberately has no jose runtime imports: suitable for a separately reported offline smoke run.
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateConfig, serverUrl } from '../src/config.js';
import { IdentityBridgeError } from '../src/errors.js';
import { cookieName, createFlow, openFlow, readFlowCookie, sealFlow, writeFlowCookie } from '../src/flow.js';
import { deadline, fetchJson } from '../src/http.js';
import { pagesCookieResponse } from '../src/pages-router.js';
import type { OidcClientConfig } from '../src/types.js';
import { decodeBase64Url, isRandomValue, parseJsonObject, safeReturnTo } from '../src/validation.js';

const BASE: OidcClientConfig = {
  issuer: 'https://identity.example.test', discoveryUrl: 'https://identity.example.test/discovery', clientId: 'test-client',
  clientSecret: 'synthetic-test-secret-never-for-production-123456', tokenEndpointAuthMethod: 'client_secret_basic',
  redirectUri: 'https://app.example.test/api/auth/callback', allowedRedirectUris: ['https://app.example.test/api/auth/callback'],
  flowCookieSecret: Uint8Array.from({ length: 32 }, (_, i) => i + 1), idTokenAlgorithms: ['ES256'], maxAuthenticationAgeSeconds: 300,
  assurance: { passwordOtp: { acrValues: ['urn:test:pwd-otp'] } },
};
const rejects = (code: string) => (error: unknown) => { assert.ok(error instanceof IdentityBridgeError); assert.equal(error.code, code); return true; };
const NOW = 1_800_000_000;

const unsafeReturns: unknown[] = [null, '', true, 1, [], ['/workspace'], {}, '/other', '//evil.example.test', 'https://evil.example.test/workspace',
  'javascript:alert(1)', '/workspaceevil', '/administrator', '/apps/studioiqevil', '/apps/studio', '/Workspace', ' /workspace', '/workspace ',
  '/workspace/../admin', '/workspace/../../evil', '/workspace/./a', '/workspace//evil.example.test', '/workspace\\evil.example.test',
  '/\\evil.example.test', '\\workspace', '/workspace/%2e%2e/evil', '/workspace/%252e%252e/evil', '/workspace/%2f%2fevil',
  '/workspace/%5cevil', '/workspace/%00', '/workspace/%0d%0aLocation:evil', '/%77orkspace', '/workspace/%61', '/workspace/%',
  '/workspace?next=https://evil.example.test', '/workspace#//evil.example.test', '/workspace\n', '/workspace\r', '/workspace\t',
  '/workspace/\u0000', '/workspace/\u007f', '/workspace/\u0085', '/workspace/\u202e', '/workspace/é', '/workspace/／evil',
  '/workspace/;x=evil', '/workspace/@evil.example.test', '/workspace/' + 'x'.repeat(513)];
for (let i = 0; i < unsafeReturns.length; i += 1) {
  test(`return path rejects adversarial input ${i + 1}`, () => assert.throws(() => safeReturnTo(unsafeReturns[i]), rejects('return_to_invalid')));
}
test('return paths accept only canonical roots and descendants; only undefined selects default', () => {
  for (const path of ['/workspace', '/workspace/', '/workspace/project_1/a-b.c~d', '/admin', '/admin/users', '/apps/studioiq', '/apps/studioiq/project-1']) assert.equal(safeReturnTo(path), path);
  assert.equal(safeReturnTo(undefined), '/workspace');
});

test('random values and base64url decoding reject padding, aliases and unbounded lengths', () => {
  const value = Buffer.alloc(32, 5).toString('base64url');
  assert.equal(isRandomValue(value), true);
  for (const bad of [value + '=', value + 'a', '!', 'A'.repeat(100000), ['state'], null]) assert.equal(isRandomValue(bad), false);
  assert.throws(() => decodeBase64Url(value + '=', 'flow_invalid', 32), rejects('flow_invalid'));
  assert.throws(() => decodeBase64Url('AB', 'flow_invalid', 32), rejects('flow_invalid')); // Non-zero discarded pad bits.
});

test('strict JSON rejects duplicate decoded keys, malformed syntax, arrays and excessive nesting', () => {
  for (const text of ['{', '[]', 'null', 'true', '{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"nested":{"x":1,"x":2}}', '{"a":' + '['.repeat(33) + '1' + ']'.repeat(33) + '}']) {
    assert.throws(() => parseJsonObject(text, 'flow_invalid'), rejects('flow_invalid'));
  }
  const text = '{"x":[{"same":1},{"same":2}],"escaped":"a \\" quote","scientific":1e2}';
  assert.deepEqual(parseJsonObject(text, 'flow_invalid'), JSON.parse(text));
});

test('cookie parsing rejects duplicate names, quotes, percent escapes, whitespace, malformed values and legacy fallback', () => {
  const config = validateConfig(BASE);
  const flow = createFlow(config, '/workspace', NOW);
  const name = cookieName(config, flow.state);
  const value = sealFlow(config, flow);
  assert.equal(readFlowCookie(config, `other=1; ${name}=${value}; final=2`, flow.state), value);
  assert.equal(readFlowCookie(config, `__Host-mp_oauth_flow=${value}`, flow.state), undefined);
  assert.equal(readFlowCookie(config, undefined, flow.state), undefined);
  for (const header of [`${name}=${value}; ${name}=${value}`, `${name}="${value}"`, `${name}=${encodeURIComponent(value)}%3D`, `${name}=`, name,
    `${name}=${value} `, `${name} =${value}`, `${name}=${value}.extra`, `${name}=${value}\r\n`, 'x'.repeat(32769)]) {
    assert.throws(() => readFlowCookie(config, header, flow.state), rejects('flow_invalid'));
  }
  assert.throws(() => cookieName(config, ['state']), rejects('state_mismatch'));
  assert.throws(() => cookieName(config, 'short'), rejects('state_mismatch'));
});

test('flow roundtrip, strict expiry, wrong state and altered payload fail closed with no network', () => {
  const config = validateConfig(BASE);
  const flow = createFlow(config, '/admin', NOW);
  const cookie = sealFlow(config, flow);
  assert.deepEqual(openFlow(config, flow.state, cookie, NOW), flow);
  assert.throws(() => openFlow(config, flow.state, cookie, NOW + 600), rejects('flow_expired'));
  assert.throws(() => openFlow(config, createFlow(config, '/workspace', NOW).state, cookie, NOW), rejects('flow_invalid'));
  const changed = `v1.${Buffer.from(JSON.stringify({ ...flow, verifier: 'changed' })).toString('base64url')}.${cookie.split('.')[2]}`;
  assert.throws(() => openFlow(config, flow.state, changed, NOW), rejects('flow_invalid'));
  assert.throws(() => openFlow(config, flow.state, cookie + '.extra', NOW), rejects('flow_invalid'));
});

test('server configuration rejects insecure URLs, weak secrets, callback mismatches and ambiguous assurance', () => {
  const mutations: Partial<OidcClientConfig>[] = [
    { issuer: 'http://identity.example.test' }, { discoveryUrl: 'https://evil.example.test/discovery' },
    { redirectUri: 'https://evil.example.test/api/auth/callback' }, { flowCookieSecret: new Uint8Array(31) }, { flowCookieSecret: new Uint8Array(32) },
    { clientSecret: 'short' }, { maxAuthenticationAgeSeconds: 0 }, { flowTtlSeconds: 601 }, { requestTimeoutMs: 0 }, { maxIdTokenLifetimeSeconds: 601 },
    { idTokenAlgorithms: ['HS256'] as never }, { additionalTrustedAudiences: [BASE.clientId] }, { assurance: {} },
    { assurance: { passkeyUv: { methodAmr: 'webauthn', userVerificationAmr: 'webauthn', acrValues: ['x'] } } },
    { assurance: { passkeyUv: { methodAmr: 'registered', userVerificationAmr: 'uv', acrValues: ['x'] } } },
    { assurance: { passkeyUv: { methodAmr: 'webauthn', userVerificationAmr: 'uv', acrValues: ['x'] }, passwordOtp: { acrValues: ['x'] } } },
    { endpointOrigins: ['https://identity.example.test/path'] },
  ];
  for (const changed of mutations) assert.throws(() => validateConfig({ ...BASE, ...changed }), rejects('configuration_invalid'));
  for (const url of ['https://identity.example.test/../x', 'https://identity.example.test/%2e/x', 'https://identity.example.test/x?y=z', 'https://user:pwd@identity.example.test/x',
    'https://IDENTITY.example.test/x', 'https://identity.example.test:443/x', 'https://identity.example.test\\evil/x']) {
    assert.throws(() => serverUrl(url, false, 'configuration_invalid'), rejects('configuration_invalid'));
  }
});

test('configuration snapshots mutable arrays, assurance lists and signing secret', () => {
  const secret = Uint8Array.from(BASE.flowCookieSecret);
  const acrValues = ['urn:test:original'];
  const config = validateConfig({ ...BASE, flowCookieSecret: secret, assurance: { passwordOtp: { acrValues } } });
  const before = Buffer.from(config.flowCookieSecret);
  secret.fill(0); acrValues[0] = 'urn:test:changed';
  assert.deepEqual(config.flowCookieSecret, before);
  assert.deepEqual(config.assurance.passwordOtp?.acrValues, ['urn:test:original']);
});

test('HTTP is allowed only with explicit local-development opt-in and literal loopback', () => {
  const old = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      const issuer = `http://${host}:3040`;
      const callback = `http://${host}:3000/api/auth/callback`;
      const config = validateConfig({ ...BASE, issuer, discoveryUrl: `${issuer}/discovery`, redirectUri: callback, allowedRedirectUris: [callback], allowInsecureLocalhost: true });
      const flow = createFlow(config, '/workspace', NOW);
      let value = '';
      writeFlowCookie(config, { appendSetCookie(header) { value = header; } }, flow.state, sealFlow(config, flow));
      assert.ok(value.startsWith('mp_oidc_dev_flow_'));
      assert.equal(value.includes('Secure'), false);
    }
    for (const host of ['localhost.evil.example', '127.0.0.2', '127.1', '2130706433', '0.0.0.0', 'app.example.test']) {
      assert.throws(() => serverUrl(`http://${host}:3040/x`, true, 'configuration_invalid'), rejects('configuration_invalid'));
    }
    assert.throws(() => serverUrl('http://localhost:3040/x', false, 'configuration_invalid'), rejects('configuration_invalid'));
    process.env.NODE_ENV = 'production';
    assert.throws(() => validateConfig({ ...BASE, allowInsecureLocalhost: true }), rejects('configuration_invalid'));
  } finally { if (old === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old; }
});

test('Pages Router adapter appends cookies and prevents cache/referrer disclosure', () => {
  const headers = new Map<string, number | string | readonly string[]>([['Set-Cookie', 'session=keep']]);
  const response = pagesCookieResponse({
    getHeader(name) { const value = headers.get(name); return Array.isArray(value) ? [...value] : value as string | number | undefined; },
    setHeader(name, value) { headers.set(name, value); },
  });
  response.appendSetCookie('flow=one'); response.appendSetCookie('flow=two');
  assert.deepEqual(headers.get('Set-Cookie'), ['session=keep', 'flow=one', 'flow=two']);
  assert.equal(headers.get('Cache-Control'), 'no-store');
  assert.equal(headers.get('Referrer-Policy'), 'no-referrer');
  assert.throws(() => pagesCookieResponse({ getHeader() { return undefined; }, setHeader() { throw new Error('secret'); } }), rejects('dependency_unavailable'));
});

test('network wrapper bounds streaming bodies and cancels a stalled response', { timeout: 3000 }, async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ start() {}, cancel() { cancelled = true; } });
  await assert.rejects(fetchJson(async () => new Response(stream, { headers: { 'content-type': 'application/json' } }),
    'https://identity.example.test/token', {}, 50, 'token_exchange_failed'), rejects('dependency_unavailable'));
  assert.equal(cancelled, true);
  await assert.rejects(fetchJson(async () => new Response('x'.repeat(65), { headers: { 'content-type': 'application/json' } }),
    'https://identity.example.test/token', {}, 100, 'token_exchange_failed', 64), rejects('token_exchange_failed'));
});

test('network wrapper rejects redirected response metadata even when an injected fetch ignores redirect:error', async () => {
  for (const property of ['redirected', 'url']) {
    const response = new Response('{}', { headers: { 'content-type': 'application/json' } });
    Object.defineProperty(response, property, { value: property === 'url' ? 'https://evil.example.test/' : true });
    await assert.rejects(fetchJson(async () => response, 'https://identity.example.test/token', {}, 100, 'token_exchange_failed'), rejects('token_exchange_failed'));
  }
});

test('deadline sanitizes errors and rejects non-cooperative dependencies', { timeout: 3000 }, async () => {
  await assert.rejects(deadline(async () => { throw new Error('token-secret'); }, 50), rejects('dependency_unavailable'));
  await assert.rejects(deadline(async () => new Promise<never>(() => {}), 50), rejects('dependency_unavailable'));
});

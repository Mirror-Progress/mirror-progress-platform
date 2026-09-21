import assert from 'node:assert/strict';
import test from 'node:test';
import { createIdentityBridge } from '../src/index.js';
import { collector, config, fixture, hasCode, json, NONCE, NOW } from './helpers.js';

const context = { nonce: NONCE, returnTo: '/workspace' };

test('default remote JWKS resolves only fixed discovery URL and validated jwks_uri; cache is reused', async () => {
  const f = await fixture({ remoteJwks: true });
  const a = await f.start();
  await f.client.completeAuthorization(a.callback, a.cookie, collector().response);
  await f.client.verifyIdentityToken(await f.sign(), context);
  assert.deepEqual(f.calls.map((call) => call.url), [f.cfg.discoveryUrl, `${f.cfg.issuer}/token`, `${f.cfg.issuer}/jwks`]);
  for (const call of f.calls) assert.equal(call.init.redirect, 'error');
});

test('remote JWKS accepts application/jwk-set+json and rejects unrecognized signing kid', async () => {
  const f = await fixture({ remoteJwks: true });
  f.faults.fetch = async (url, init) => url.endsWith('/jwks')
    ? new Response(JSON.stringify(f.jwks), { headers: { 'content-type': 'application/jwk-set+json' } })
    : f.defaultFetch(url, init);
  await f.client.verifyIdentityToken(await f.sign(), context);
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({}, [], { kid: 'unknown-key' }), context), hasCode('identity_token_invalid'));
});

const badMetadata: [string, Record<string, unknown>][] = [
  ['wrong issuer', { issuer: 'https://evil.example.test' }],
  ['inexact issuer slash', { issuer: 'https://identity.example.test/' }],
  ['no S256', { code_challenge_methods_supported: ['plain'] }],
  ['no code response', { response_types_supported: ['token'] }],
  ['wrong algorithm', { id_token_signing_alg_values_supported: ['HS256'] }],
  ['null authentication metadata', { token_endpoint_auth_methods_supported: null }],
  ['public-client authentication only', { token_endpoint_auth_methods_supported: ['none'] }],
  ['no authorization-code grant', { grant_types_supported: ['client_credentials'] }],
  ['form_post only', { response_modes_supported: ['form_post'] }],
  ['missing required scope', { scopes_supported: ['openid'] }],
  ['no RFC 9207', { authorization_response_iss_parameter_supported: false }],
  ['coerced RFC 9207', { authorization_response_iss_parameter_supported: 'true' }],
];
for (const endpoint of ['authorization_endpoint', 'token_endpoint', 'jwks_uri']) {
  for (const url of ['http://identity.example.test/endpoint', 'http://127.0.0.1/internal', 'https://evil.example.test/endpoint',
    'https://identity.example.test@evil.example.test/endpoint', 'https://identity.example.test/../endpoint',
    'https://identity.example.test/endpoint#x', 'https://identity.example.test/endpoint?next=evil', 'https://identity.example.test/%2e/endpoint']) {
    badMetadata.push([`${endpoint} rejects ${url}`, { [endpoint]: url }]);
  }
}
for (const [name, changes] of badMetadata) {
  test(`discovery rejects ${name} before setting cookies or exchanging tokens`, async () => {
    const f = await fixture();
    Object.assign(f.metadata, changes);
    const cookies = collector();
    await assert.rejects(f.client.beginAuthorization({ method: 'GET' }, cookies.response), hasCode('discovery_invalid'));
    assert.equal(cookies.values.length, 0);
    assert.deepEqual(f.calls.map((call) => call.url), [f.cfg.discoveryUrl]);
  });
}

test('omitted optional discovery metadata uses OIDC defaults, but required fields cannot be omitted', async () => {
  const f = await fixture();
  for (const field of ['grant_types_supported', 'response_modes_supported', 'scopes_supported', 'token_endpoint_auth_methods_supported']) delete f.metadata[field];
  await f.start();
  for (const field of ['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri', 'code_challenge_methods_supported', 'id_token_signing_alg_values_supported', 'response_types_supported', 'authorization_response_iss_parameter_supported']) {
    const bad = await fixture();
    delete bad.metadata[field];
    await assert.rejects(bad.start(), hasCode('discovery_invalid'));
  }
});

test('discovery is single-flight, caches only successful results, and fails closed after cache expiry', async () => {
  const f = await fixture();
  await Promise.all([f.start(), f.start(), f.start()]);
  assert.equal(f.calls.length, 1);
  f.clock.seconds = NOW + 300;
  f.faults.fetch = async () => { throw new Error('synthetic network unavailable'); };
  await assert.rejects(f.start(), hasCode('dependency_unavailable'));
  delete f.faults.fetch;
  await f.start();
  assert.equal(f.calls.length, 3); // The rejected refresh never poisons the pending promise.
});

test('failure in injected fetch, JWKS, replay store, clock or cookie response is sanitized', async () => {
  const sensitive = 'SYNTHETIC-SHOULD-NOT-APPEAR-IN-ERRORS';
  for (const dependency of ['fetch', 'jwks', 'consume'] as const) {
    const f = await fixture();
    const a = await f.start();
    f.faults[dependency] = async () => { throw new Error(sensitive); };
    const cookies = collector();
    await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, cookies.response), hasCode('dependency_unavailable'));
    assert.match(cookies.values[0]!, /Max-Age=0/u);
  }
  const f = await fixture();
  await assert.rejects(f.client.beginAuthorization({ method: 'GET' }, { appendSetCookie() { throw new Error(sensitive); } }), hasCode('dependency_unavailable'));
  const badClock = createIdentityBridge(config(), { consumeFlow: async () => true, now: () => NaN, jwks: async () => f.keys.publicKey });
  await assert.rejects(badClock.verifyIdentityToken(await f.sign(), context), hasCode('dependency_unavailable'));
});

test('dependency timeouts reject even when fetch, JWKS or replay adapter ignores the signal', { timeout: 5000 }, async () => {
  for (const dependency of ['fetch', 'jwks', 'consume'] as const) {
    const f = await fixture({ config: { requestTimeoutMs: 50 } });
    const a = await f.start();
    let signal: AbortSignal | undefined;
    if (dependency === 'fetch') f.faults.fetch = async (_url, init) => { signal = init.signal ?? undefined; return new Promise<Response>(() => {}); };
    if (dependency === 'jwks') f.faults.jwks = async () => new Promise<CryptoKey>(() => {});
    if (dependency === 'consume') f.faults.consume = async (_key, _exp, abort) => { signal = abort; return new Promise<boolean>(() => {}); };
    await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('dependency_unavailable'));
    if (signal) assert.equal(signal.aborted, true);
  }
});

test('failed token exchange burns the flow; no automatic retry can resubmit the code', async () => {
  const f = await fixture();
  const a = await f.start();
  f.faults.fetch = async () => { throw new Error('unavailable'); };
  await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('dependency_unavailable'));
  delete f.faults.fetch;
  await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_replayed'));
  assert.equal(f.calls.filter((call) => call.url.endsWith('/token')).length, 1);
});

test('token endpoint errors, invalid JSON, missing tokens, coercions and redirects never return an identity', async () => {
  const responses: ((token: string) => Response)[] = [
    () => json({ error: 'invalid_grant' }, 400), () => json({ error: 'server_error' }, 503),
    () => new Response(null, { status: 302, headers: { location: 'https://evil.example.test/' } }),
    () => new Response('{', { headers: { 'content-type': 'application/json' } }),
    () => new Response('{}', { headers: { 'content-type': 'text/html' } }),
    () => json({}), () => json({ id_token: true, access_token: 'x', token_type: 'Bearer' }),
    (id_token) => json({ id_token, token_type: 'Bearer' }), (id_token) => json({ id_token, access_token: 'x', token_type: 'DPoP' }),
    (id_token) => json({ id_token, access_token: '', token_type: 'Bearer' }),
    (id_token) => json({ id_token, access_token: 'x', token_type: 'Bearer', error: 'invalid_grant' }),
    (id_token) => new Response(`{"id_token":"${id_token}","id_token":"different","access_token":"x","token_type":"Bearer"}`, { headers: { 'content-type': 'application/json' } }),
    () => new Response('x'.repeat(32769), { headers: { 'content-type': 'application/json' } }),
    () => new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': '999999' } }),
  ];
  for (const tokenResponse of responses) {
    const f = await fixture();
    const a = await f.start();
    f.faults.tokenResponse = tokenResponse;
    await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('token_exchange_failed'));
    assert.equal(f.calls.filter((call) => call.url.endsWith('/token')).length, 1);
  }
});

test('remote JWKS failures are controlled and do not follow endpoint redirects', async () => {
  const responses = [
    () => json({ keys: [] }), () => json({ keys: 'wrong' }), () => json({ keys: Array.from({ length: 33 }, () => ({})) }),
    () => new Response(null, { status: 302, headers: { location: 'https://evil.example.test/jwks' } }),
    () => new Response('{', { headers: { 'content-type': 'application/json' } }),
    () => json({ error: 'unavailable' }, 503), () => new Response('x'.repeat(65537), { headers: { 'content-type': 'application/json' } }),
  ];
  for (const response of responses) {
    const f = await fixture({ remoteJwks: true });
    f.faults.fetch = async (url, init) => url.endsWith('/jwks') ? response() : f.defaultFetch(url, init);
    await assert.rejects(f.client.verifyIdentityToken(await f.sign(), context), hasCode('dependency_unavailable'));
    assert.equal(f.calls.some((call) => call.url.includes('evil.example.test')), false);
  }
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createIdentityBridge } from '../src/index.js';
import { collector, fixture, flowPayload, hasCode, NOW, resealFlow } from './helpers.js';

const tokenCalls = (f: Awaited<ReturnType<typeof fixture>>) => f.calls.filter((call) => call.url.endsWith('/token'));

test('authorization uses fresh random state/nonce and bound S256; completion returns only verified identity', async () => {
  const f = await fixture();
  const a = await f.start('/apps/studioiq/project-1');
  const flow = flowPayload(a.cookie);
  const p = a.url.searchParams;
  assert.equal(p.get('response_type'), 'code');
  assert.equal(p.get('response_mode'), 'query');
  assert.equal(p.get('scope'), 'openid email');
  assert.equal(p.get('code_challenge_method'), 'S256');
  assert.equal(p.get('max_age'), '3600');
  assert.equal(p.get('redirect_uri'), f.cfg.redirectUri);
  assert.equal(p.get('client_id'), f.cfg.clientId);
  assert.equal(p.get('code_challenge'), createHash('sha256').update(String(flow.verifier)).digest('base64url'));
  assert.equal(Buffer.from(String(flow.verifier), 'base64url').length, 48);
  assert.equal(Buffer.from(a.authorization.state, 'base64url').length, 32);
  assert.equal(Buffer.from(p.get('nonce')!, 'base64url').length, 32);
  assert.notEqual(a.authorization.state, p.get('nonce'));
  assert.equal(a.authorization.authorizationUrl.includes(f.cfg.clientSecret), false);
  assert.equal(a.authorization.authorizationUrl.includes(String(flow.verifier)), false);
  const requestedClaims = JSON.parse(p.get('claims')!) as { id_token: Record<string, { essential: boolean }> };
  for (const key of ['amr', 'acr', 'auth_time']) assert.equal(requestedClaims.id_token[key]?.essential, true);
  assert.match(a.cookies.values[0]!, /^__Host-mp_oidc_flow_[A-Za-z0-9_-]{43}=v1\./u);
  for (const attribute of ['Path=/', 'Max-Age=600', 'HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(a.cookies.values[0]!.includes(attribute));
  assert.equal(a.cookies.values.length, 1); // No legacy, non-state-scoped fallback.
  assert.equal(a.cookies.values[0]!.includes('Domain='), false);
  const response = collector();
  const identity = await f.client.completeAuthorization(a.callback, a.cookie, response.response);
  assert.equal(identity.returnTo, '/apps/studioiq/project-1');
  assert.equal(identity.issuer, f.cfg.issuer);
  assert.equal(identity.authTime, NOW - 20);
  assert.equal(identity.mfaVerifiedAt, new Date((NOW - 20) * 1000).toISOString());
  assert.deepEqual(Object.keys(identity).sort(), ['issuer', 'subject', 'email', 'emailVerified', 'authTime', 'amr', 'assurance', 'mfaVerifiedAt', 'returnTo'].sort());
  assert.match(response.values[0]!, /Max-Age=0;.*Expires=Thu, 01 Jan 1970/u);
  assert.equal(tokenCalls(f).length, 1);
  const request = tokenCalls(f)[0]!.init;
  assert.equal(request.redirect, 'error');
  assert.equal(request.cache, 'no-store');
  assert.equal(request.credentials, 'omit');
  assert.equal(request.referrerPolicy, 'no-referrer');
  assert.ok(new Headers(request.headers).get('authorization')?.startsWith('Basic '));
  assert.equal(new URLSearchParams(String(request.body)).has('client_secret'), false);
});

test('independent tabs get different state-scoped cookies, nonce, verifier and can finish out of order', async () => {
  const f = await fixture();
  const a = await f.start('/workspace/a');
  const b = await f.start('/workspace/b');
  assert.notEqual(a.authorization.state, b.authorization.state);
  assert.notEqual(a.url.searchParams.get('nonce'), b.url.searchParams.get('nonce'));
  assert.notEqual(flowPayload(a.cookie).verifier, flowPayload(b.cookie).verifier);
  const header = `${a.cookieHeader}; ${b.cookieHeader}; unrelated=kept`;
  assert.equal(f.client.readFlowCookie(header, a.authorization.state), a.cookie);
  assert.equal(f.client.readFlowCookie(header, b.authorization.state), b.cookie);
  const resB = collector();
  assert.equal((await f.client.completeAuthorization(b.callback, b.cookie, resB.response)).returnTo, '/workspace/b');
  assert.equal(resB.values.some((value) => value.includes(a.authorization.state)), false);
  assert.equal((await f.client.completeAuthorization(a.callback, a.cookie, collector().response)).returnTo, '/workspace/a');
});

test('same state is atomically consumed once even with simultaneous callbacks', async () => {
  const f = await fixture();
  const a = await f.start();
  const results = await Promise.allSettled([1, 2].map(() => f.client.completeAuthorization(a.callback, a.cookie, collector().response)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rejection = results.find((r) => r.status === 'rejected');
  assert.equal(rejection?.status, 'rejected');
  if (rejection?.status === 'rejected') hasCode('flow_replayed')(rejection.reason);
  assert.equal(tokenCalls(f).length, 1);
  await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_replayed'));
});

test('replay adapter receives only an opaque digest, expiry in seconds, and a signal', async () => {
  const f = await fixture();
  const a = await f.start();
  let invoked = false;
  f.faults.consume = async (key, expiresAt, signal) => {
    invoked = true;
    assert.match(key, /^identity-bridge:v1:[A-Za-z0-9_-]{43}$/u);
    assert.equal(key.includes(a.authorization.state), false);
    assert.equal(expiresAt, NOW + 600);
    assert.ok(signal instanceof AbortSignal);
    return true;
  };
  await f.client.completeAuthorization(a.callback, a.cookie, collector().response);
  assert.equal(invoked, true);
});

test('wrong flow cookie/state fails before token endpoint or replay dependency', async () => {
  const f = await fixture();
  const a = await f.start();
  const b = await f.start();
  const response = collector();
  await assert.rejects(f.client.completeAuthorization(a.callback, b.cookie, response.response), hasCode('flow_invalid', 'state_mismatch'));
  assert.equal(tokenCalls(f).length, 0);
  assert.equal(f.consumed.size, 0);
  assert.ok(response.values[0]!.startsWith(`${f.client.flowCookieName(a.authorization.state)}=`));
});

test('cookie expiry is strict at boundary and checked again after asynchronous work', async () => {
  for (const time of [NOW + 600, NOW + 601]) {
    const f = await fixture();
    const a = await f.start();
    f.clock.seconds = time;
    await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_expired'));
    assert.equal(tokenCalls(f).length, 0);
  }
  const f = await fixture();
  const a = await f.start();
  f.faults.fetch = async (url, init) => {
    if (url.endsWith('/token')) f.clock.seconds = NOW + 600;
    return f.defaultFetch(url, init);
  };
  await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_expired'));
});

test('malformed, missing, tampered, oversized, padded, and extra-segment cookies fail closed', async () => {
  const f = await fixture();
  const a = await f.start();
  const [version, payload, mac] = a.cookie.split('.');
  const values = [undefined, '', 'garbage', `${payload}.${mac}`, `${version}.${payload}.${mac}.extra`, `${version}.${payload}=.${mac}`,
    `v2.${payload}.${mac}`, `v1.${payload}.${'A'.repeat(43)}`, `v1.${payload}.${mac}=`, `v1.!.${mac}`, 'x'.repeat(3501),
    `${version}.${payload!.slice(0, -1)}A.${mac}`];
  for (const cookie of values) await assert.rejects(f.client.completeAuthorization(a.callback, cookie, collector().response), hasCode('flow_invalid'));
  assert.equal(tokenCalls(f).length, 0);
});

test('even correctly signed cookies must have canonical JSON, exact schema and valid binding', async () => {
  const f = await fixture();
  const a = await f.start();
  const original = flowPayload(a.cookie);
  const mutations: Record<string, unknown>[] = [
    { version: 2 }, { state: 'bad-state' }, { nonce: '' }, { nonce: 12 }, { verifier: 'short' },
    { issuer: 'https://evil.example.test' }, { clientId: 'different' }, { redirectUri: 'https://evil.example.test/callback' },
    { returnTo: '/workspace/../../evil' }, { returnTo: '/workspace/%2f%2fevil.example.test' }, { returnTo: null },
    { issuedAt: NOW + 1, expiresAt: NOW + 601 }, { issuedAt: String(NOW) }, { expiresAt: NOW + 601 },
    { expiresAt: String(NOW + 600) }, { extra: true },
  ];
  for (const change of mutations) {
    const cookie = resealFlow(f.cfg, a.authorization.state, JSON.stringify({ ...original, ...change }));
    await assert.rejects(f.client.completeAuthorization(a.callback, cookie, collector().response), hasCode('flow_invalid', 'state_mismatch'));
  }
  const noNonce = { ...original }; delete noNonce.nonce;
  const malformedTexts = ['[]', 'null', '{', JSON.stringify(noNonce), ` ${JSON.stringify(original)}`,
    `${JSON.stringify(original).slice(0, -1)},"state":"${a.authorization.state}"}`];
  for (const text of malformedTexts) {
    await assert.rejects(f.client.completeAuthorization(a.callback, resealFlow(f.cfg, a.authorization.state, text), collector().response), hasCode('flow_invalid'));
  }
  const changedState = flowPayload((await f.start()).cookie).state;
  await assert.rejects(f.client.completeAuthorization(a.callback,
    resealFlow(f.cfg, a.authorization.state, JSON.stringify({ ...original, state: changedState })), collector().response), hasCode('state_mismatch'));
  assert.equal(tokenCalls(f).length, 0);
});

test('flow MAC cannot be reused across configured clients or callback URIs, even with same secret', async () => {
  const f = await fixture();
  const a = await f.start();
  for (const overrides of [{ clientId: 'another-client' }, { redirectUri: 'https://other.example.test/api/auth/callback', allowedRedirectUris: ['https://other.example.test/api/auth/callback'] }]) {
    const other = createIdentityBridge({ ...f.cfg, ...overrides }, { consumeFlow: async () => true, fetch: async () => { throw new Error('must not fetch'); }, now: () => NOW * 1000 });
    await assert.rejects(other.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_invalid'));
  }
});

test('mock token endpoint checks PKCE: exchanging flow A code with flow B verifier is rejected', async () => {
  const f = await fixture();
  const a = await f.start();
  const b = await f.start();
  const rawUrl = b.callback.rawUrl.replace(`code=${b.code}`, `code=${a.code}`);
  await assert.rejects(f.client.completeAuthorization({ method: 'GET', rawUrl }, b.cookie, collector().response), hasCode('token_exchange_failed'));
  assert.equal(f.usedCodes.size, 0);
  assert.equal(tokenCalls(f).length, 1);
});

test('tampering verifier without a new MAC never reaches the endpoint', async () => {
  const f = await fixture();
  const a = await f.start();
  const changed = { ...flowPayload(a.cookie), verifier: Buffer.alloc(48, 9).toString('base64url') };
  const tampered = `v1.${Buffer.from(JSON.stringify(changed)).toString('base64url')}.${a.cookie.split('.')[2]}`;
  await assert.rejects(f.client.completeAuthorization(a.callback, tampered, collector().response), hasCode('flow_invalid'));
  assert.equal(tokenCalls(f).length, 0);
});

test('confidential post auth is explicit; special characters in Basic credentials are form-encoded separately', async () => {
  for (const auth of ['client_secret_basic', 'client_secret_post'] as const) {
    const f = await fixture({ config: { tokenEndpointAuthMethod: auth, clientId: 'client:with+punctuation', clientSecret: 'synthetic secret with spaces:+/&=01234567890123456789' } });
    const a = await f.start();
    await f.client.completeAuthorization(a.callback, a.cookie, collector().response);
    const init = tokenCalls(f)[0]!.init;
    const body = new URLSearchParams(String(init.body));
    if (auth === 'client_secret_post') {
      assert.equal(body.get('client_secret'), f.cfg.clientSecret);
      assert.equal(new Headers(init.headers).has('authorization'), false);
    } else {
      const header = new Headers(init.headers).get('authorization')!;
      const decoded = Buffer.from(header.slice(6), 'base64').toString();
      assert.equal(decoded, 'client%3Awith%2Bpunctuation:synthetic+secret+with+spaces%3A%2B%2F%26%3D01234567890123456789');
      assert.equal(body.has('client_secret'), false);
    }
  }
});

test('callback errors are consumed and sanitized, without token exchange or automatic retry', async () => {
  const f = await fixture();
  const a = await f.start();
  const rawUrl = `/api/auth/callback?${new URLSearchParams({ state: a.authorization.state, iss: f.cfg.issuer, error: 'access_denied', error_description: 'untrusted-provider-text', error_uri: 'https://evil.example.test/' })}`;
  await assert.rejects(f.client.completeAuthorization({ method: 'GET', rawUrl }, a.cookie, collector().response), hasCode('authorization_denied'));
  assert.equal(tokenCalls(f).length, 0);
  await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('flow_replayed'));
});

test('raw callback parsing rejects duplicate fields, ambiguous encodings, fragments, absolute URLs, wrong issuer and wrong route', async () => {
  const f = await fixture();
  const a = await f.start();
  const invalidUrls = [a.callback.rawUrl + '&code=another', a.callback.rawUrl + '&%73tate=duplicate', a.callback.rawUrl + '&iss=evil',
    a.callback.rawUrl + '&returnTo=/admin', a.callback.rawUrl + '&code=%ZZ', a.callback.rawUrl + '&session_state=%00',
    a.callback.rawUrl + '&session_state=%FF', a.callback.rawUrl + '#fragment', `https://app.example.test${a.callback.rawUrl}`,
    `https://evil.example.test${a.callback.rawUrl}`, `//evil.example.test${a.callback.rawUrl}`, a.callback.rawUrl.replace('/api/auth/', '/api/other/'),
    a.callback.rawUrl.replace('/api/auth/', '/api/%61uth/'), a.callback.rawUrl.replace('/api/auth/', '/api/auth/../auth/'),
    a.callback.rawUrl.replace('iss=', 'missing_iss='), a.callback.rawUrl.replace(encodeURIComponent(f.cfg.issuer), 'https%3A%2F%2Fevil.example.test'),
    a.callback.rawUrl.replace(`code=${a.code}`, 'code='), a.callback.rawUrl.replace(`code=${a.code}`, 'code=a%0D%0Ab'),
    a.callback.rawUrl.replace(a.authorization.state, 'short'), a.callback.rawUrl + '&error=access_denied',
    a.callback.rawUrl.replace(`code=${a.code}`, 'error=access_denied&error_description=one&error_description=two'),
    a.callback.rawUrl.replace(`code=${a.code}`, `code=${'A'.repeat(2049)}`), a.callback.rawUrl + '&session_state=' + 'x'.repeat(8192)];
  for (const rawUrl of invalidUrls) await assert.rejects(f.client.completeAuthorization({ method: 'GET', rawUrl }, a.cookie, collector().response), hasCode('callback_invalid', 'state_mismatch'));
  for (const method of ['POST', 'PUT', 'HEAD', 'get']) await assert.rejects(f.client.completeAuthorization({ method, rawUrl: a.callback.rawUrl }, a.cookie, collector().response), hasCode('callback_invalid'));
  assert.equal(tokenCalls(f).length, 0);
  assert.equal(f.consumed.size, 0);
});

test('untrusted Host, forwarding headers and redirect fields have no selection authority', async () => {
  const f = await fixture({ config: { allowedRedirectUris: ['https://app.example.test/api/auth/callback', 'https://other.example.test/api/auth/callback'] } });
  const request = { method: 'GET', headers: { host: 'evil.example.test', 'x-forwarded-host': 'other.example.test', forwarded: 'host=evil.example.test;proto=http' }, redirectUri: 'https://other.example.test/api/auth/callback' };
  const start = await f.client.beginAuthorization(request, collector().response);
  assert.equal(new URL(start.authorizationUrl).searchParams.get('redirect_uri'), f.cfg.redirectUri);
});

test('beginAuthorization rejects unsafe targets and request methods before any discovery fetch or cookie write', async () => {
  const f = await fixture();
  const cookies = collector();
  for (const returnTo of ['//evil.example.test', '/workspace/%2f%2fevil', '/workspace/../admin', '/admin\\evil', '/workspace?next=evil', ['/workspace']]) {
    await assert.rejects(f.client.beginAuthorization({ method: 'GET', returnTo }, cookies.response), hasCode('return_to_invalid'));
  }
  for (const method of ['POST', 'HEAD', 'get']) await assert.rejects(f.client.beginAuthorization({ method }, cookies.response), hasCode('request_invalid'));
  assert.equal(f.calls.length, 0);
  assert.equal(cookies.values.length, 0);
});

test('wrong issuer, audience, nonce and future auth_time are rejected after real mocked code exchange', async () => {
  for (const claims of [{ iss: 'https://evil.example.test' }, { aud: 'other-client' }, { nonce: Buffer.alloc(32, 2).toString('base64url') }, { auth_time: NOW + 1 }]) {
    const f = await fixture();
    const a = await f.start();
    f.faults.tokenClaims = claims;
    await assert.rejects(f.client.completeAuthorization(a.callback, a.cookie, collector().response), hasCode('identity_token_invalid'));
    assert.equal(tokenCalls(f).length, 1);
  }
});

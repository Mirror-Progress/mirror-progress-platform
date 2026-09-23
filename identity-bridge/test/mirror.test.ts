import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fixture, collector, NONCE, NOW, hasCode } from './helpers.js';
const namespace = 'https://mirrorprogress.com/';
const context = { nonce: NONCE, returnTo: '/workspace' };
const policy = { mirrorV1: true } as const;
const evidence = { version: 1, session_id: 'real-library-session', method: 'passkey_uv', verified_at: NOW - 20,
  password_verified_at: null, expires_at: NOW + 300 };
const claims = { [`${namespace}principal_id`]: 'existing-principal', [`${namespace}authorization_epoch`]: '9007199254740993',
  [`${namespace}assurance`]: evidence, acr: '0', auth_time: NOW - 600 };
const setup = () => fixture({ config: { assurance: policy, tokenEndpointAuthMethod: 'none', clientSecret: '' } });
test('Mirror uses the signed ceremony time, precise epoch and existing principal; ACR 0 adds no assurance', async () => {
  const f = await setup();
  const identity = await f.client.verifyIdentityToken(await f.sign(claims, ['amr']), context);
  assert.equal(identity.authTime, evidence.verified_at); assert.equal(identity.authorizationEpoch, '9007199254740993');
  assert.equal(identity.principalId, 'existing-principal'); assert.equal(identity.assurance.acr, null);
  assert.deepEqual(identity.amr, []); assert.equal(identity.identitySessionId, evidence.session_id);
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({ acr: '0' }), context), hasCode('assurance_insufficient'));
});
for (const epoch of [0, 9007199254740992, '01', '-1', '1e3', '9223372036854775808', '', null]) {
  test(`Mirror rejects noncanonical or out-of-range epoch ${String(epoch)}`, async () => {
    const f = await setup();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({ ...claims, [`${namespace}authorization_epoch`]: epoch }), context), hasCode('assurance_insufficient'));
  });
}
for (const epoch of ['0', '9223372036854775807']) {
  test(`Mirror preserves exact epoch ${epoch}`, async () => {
    const f = await setup();
    assert.equal((await f.client.verifyIdentityToken(await f.sign({ ...claims, [`${namespace}authorization_epoch`]: epoch }), context)).authorizationEpoch, epoch);
  });
}
for (const delta of [{ version: 2 }, { session_id: '' }, { method: 'registered' }, { verified_at: NOW + 1 },
  { verified_at: '1800000000' }, { password_verified_at: NOW - 30 }, { extra: true }, { expires_at: NOW + 4000 },
  { method: 'password_totp', password_verified_at: null }, { method: 'password_totp', password_verified_at: NOW - 320 }]) {
  test(`Mirror rejects invalid evidence ${JSON.stringify(delta)}`, async () => {
    const f = await setup();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({ ...claims, [`${namespace}assurance`]: { ...evidence, ...delta } }), context), hasCode('assurance_insufficient'));
  });
}
test('Mirror rejects expiry, stale authentication, missing session and standard sid mismatch', async () => {
  const f = await setup();
  for (const delta of [{ expires_at: NOW }, { verified_at: NOW - 3600, expires_at: NOW }]) {
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({ ...claims, [`${namespace}assurance`]: { ...evidence, ...delta } }), context), hasCode('authentication_stale'));
  }
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({ ...claims, sid: 'different-session' }), context), hasCode('assurance_insufficient'));
});
test('Mirror accepts only a bounded completed password/TOTP ceremony', async () => {
  const f = await setup();
  const id = await f.client.verifyIdentityToken(await f.sign({ ...claims, [`${namespace}assurance`]: {
    ...evidence, method: 'password_totp', password_verified_at: NOW - 100 } }), context);
  assert.equal(id.assurance.kind, 'pwd-otp');
});
test('Mirror authorization sends only the exact provider-supported code and PKCE parameters', async () => {
  const f = await setup(); f.metadata.token_endpoint_auth_methods_supported = ['none'];
  const start = await f.start();
  assert.deepEqual([...start.url.searchParams.keys()].sort(), ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method'].sort());
  f.faults.tokenClaims = claims;
  const result = await f.client.completeAuthorization(start.callback, start.cookie, collector().response);
  assert.equal(result.principalId, 'existing-principal');
  const body = new URLSearchParams(String(f.calls.at(-1)!.init.body));
  assert.equal(body.has('client_secret'), false); assert.equal(body.get('client_id'), f.cfg.clientId);
});
for (const claim of ['at_hash', 'c_hash', 's_hash']) {
  test(`verifies ${claim} against transaction input and rejects absent/wrong input`, async () => {
    const f = await setup(), input = 'actual-transaction-value';
    const hash = createHash('sha256').update(input).digest().subarray(0, 16).toString('base64url');
    const key = claim === 'at_hash' ? 'accessToken' : claim === 'c_hash' ? 'code' : 'state';
    const token = await f.sign({ ...claims, [claim]: hash });
    await f.client.verifyIdentityToken(token, { ...context, [key]: input });
    await assert.rejects(f.client.verifyIdentityToken(token, { ...context, [key]: 'wrong' }), hasCode('identity_token_invalid'));
    await assert.rejects(f.client.verifyIdentityToken(token, context), hasCode('identity_token_invalid'));
  });
}

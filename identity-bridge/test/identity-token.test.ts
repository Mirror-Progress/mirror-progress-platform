import { createIdentityBridge } from '../src/client.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { CompactSign, generateKeyPair, SignJWT } from 'jose';
import { collector, fixture, hasCode, NONCE, NOW, OTP_ACR, PASSKEY_ACR } from './helpers.js';

const context = { nonce: NONCE, returnTo: '/workspace' };

test('returns exactly a frozen verified Identity, with MFA time from auth_time', async () => {
  const f = await fixture();
  const id = await f.client.verifyIdentityToken(await f.sign({ auth_time: NOW - 120, roles: ['admin'], registeredPasskey: true, name: 'Not returned' }), context);
  assert.deepEqual(Object.keys(id).sort(), ['issuer', 'subject', 'email', 'emailVerified', 'authTime', 'amr', 'assurance', 'mfaVerifiedAt', 'returnTo'].sort());
  assert.equal(id.authTime, NOW - 120);
  assert.equal(id.mfaVerifiedAt, new Date((NOW - 120) * 1000).toISOString());
  assert.notEqual(id.mfaVerifiedAt, new Date(NOW * 1000).toISOString());
  assert.deepEqual(id.assurance, { kind: 'passkey-uv', acr: PASSKEY_ACR });
  assert.ok(Object.isFrozen(id) && Object.isFrozen(id.amr) && Object.isFrozen(id.assurance));
});

test('accepts password + OTP only with the allowlisted issuer context', async () => {
  const f = await fixture();
  const id = await f.client.verifyIdentityToken(await f.sign({ amr: ['pwd', 'otp', 'mfa'], acr: OTP_ACR }), context);
  assert.equal(id.assurance.kind, 'pwd-otp');
});

const invalid: [string, Record<string, unknown>][] = [
  ['wrong issuer', { iss: 'https://attacker.example.test' }],
  ['issuer trailing slash mismatch', { iss: 'https://identity.example.test/' }],
  ['wrong audience', { aud: 'another-client' }],
  ['empty audience array', { aud: [] }],
  ['duplicate audience', { aud: ['synthetic-client', 'synthetic-client'] }],
  ['unknown additional audience with azp', { aud: ['synthetic-client', 'untrusted'], azp: 'synthetic-client' }],
  ['wrong azp even single audience', { azp: 'another-client' }],
  ['wrong nonce', { nonce: Buffer.alloc(32, 8).toString('base64url') }],
  ['numeric nonce', { nonce: 123 }],
  ['empty subject', { sub: '' }],
  ['non-string subject', { sub: 123 }],
  ['oversized subject', { sub: 'x'.repeat(256) }],
  ['subject control character', { sub: 'abc\n' }],
  ['subject non-ASCII', { sub: 'é' }],
  ['expired exp', { exp: NOW - 1, iat: NOW - 121 }],
  ['exp boundary is expired', { exp: NOW, iat: NOW - 120 }],
  ['string exp', { exp: String(NOW + 120) }],
  ['null exp', { exp: null }],
  ['fractional exp', { exp: NOW + 120.5 }],
  ['lifetime too long', { exp: NOW + 601 }],
  ['exp before iat', { exp: NOW + 10, iat: NOW + 20 }],
  ['future iat', { iat: NOW + 1 }],
  ['fractional iat', { iat: NOW - 0.5 }],
  ['string iat', { iat: String(NOW) }],
  ['future nbf', { nbf: NOW + 1 }],
  ['string nbf', { nbf: String(NOW) }],
  ['fractional nbf', { nbf: NOW - 0.5 }],
  ['future auth_time', { auth_time: NOW + 1 }],
  ['auth_time after iat even when both in past', { iat: NOW - 10, auth_time: NOW - 5 }],
  ['string auth_time', { auth_time: String(NOW - 10) }],
  ['fractional auth_time', { auth_time: NOW - 0.5 }],
  ['zero auth_time', { auth_time: 0 }],
  ['milliseconds auth_time', { auth_time: NOW * 1000 }],
  ['numeric acr', { acr: 2 }],
  ['string amr', { amr: 'pwd otp' }],
  ['mixed amr', { amr: ['webauthn', 'uv', true] }],
  ['duplicate amr', { amr: ['webauthn', 'uv', 'uv'] }],
  ['too many amr entries', { amr: Array.from({ length: 17 }, (_, i) => `amr-${i}`) }],
  ['coerced email verification', { email_verified: 'true' }],
  ['numeric email verification', { email_verified: 1 }],
  ['non-string email', { email: 123 }],
  ['email containing controls', { email: 'a@example.test\n' }],
];
for (const [name, overrides] of invalid) {
  test(`rejects ID token: ${name}`, async () => {
    const f = await fixture();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign(overrides), context), hasCode('identity_token_invalid'));
  });
}
for (const claim of ['iss', 'aud', 'nonce', 'sub', 'exp', 'iat']) {
  test(`requires claim ${claim}`, async () => {
    const f = await fixture();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({}, [claim]), context), hasCode('identity_token_invalid'));
  });
}
for (const claim of ['amr', 'acr', 'auth_time']) {
  test(`never substitutes missing MFA claim ${claim}`, async () => {
    const f = await fixture();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({ mfaVerifiedAt: new Date(NOW * 1000).toISOString(), mfa: true }, [claim]), context), hasCode('assurance_insufficient'));
  });
}
const insufficient: [string, Record<string, unknown>][] = [
  ['password only', { amr: ['pwd'], acr: OTP_ACR }],
  ['OTP only', { amr: ['otp'], acr: OTP_ACR }],
  ['generic MFA marker only', { amr: ['mfa'], acr: OTP_ACR }],
  ['pwd + generic MFA marker', { amr: ['pwd', 'mfa'], acr: OTP_ACR }],
  ['unknown acr despite pwd+otp', { amr: ['pwd', 'otp'], acr: 'urn:unapproved:mfa' }],
  ['acr 0 despite pwd+otp', { amr: ['pwd', 'otp'], acr: '0' }],
  ['passkey without user verification', { amr: ['webauthn'], acr: PASSKEY_ACR }],
  ['user verification without assertion', { amr: ['uv'], acr: PASSKEY_ACR }],
  ['enrollment only', { amr: ['passkey_registered'], acr: PASSKEY_ACR, passkeyRegistered: true }],
  ['password with registered passkey', { amr: ['pwd', 'webauthn_registered'], acr: PASSKEY_ACR, twoFactorEnabled: true }],
  ['passkey AMR with password context', { amr: ['webauthn', 'uv'], acr: OTP_ACR }],
  ['password AMR with passkey context', { amr: ['pwd', 'otp'], acr: PASSKEY_ACR }],
  ['case mismatch', { amr: ['WEBAUTHN', 'UV'], acr: PASSKEY_ACR }],
];
for (const [name, claims] of insufficient) {
  test(`rejects insufficient ceremony: ${name}`, async () => {
    const f = await fixture();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign(claims), context), hasCode('assurance_insufficient'));
  });
}

test('authentication freshness uses signed auth_time, including exact boundary', async () => {
  const f = await fixture();
  await f.client.verifyIdentityToken(await f.sign({ auth_time: NOW - 3600 }), context);
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({ auth_time: NOW - 3601 }), context), hasCode('authentication_stale'));
});

test('accepts explicitly trusted multiple audiences only with exact azp', async () => {
  const f = await fixture({ config: { additionalTrustedAudiences: ['trusted-resource'] } });
  const aud = ['synthetic-client', 'trusted-resource'];
  await f.client.verifyIdentityToken(await f.sign({ aud, azp: f.cfg.clientId }), context);
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({ aud }), context), hasCode('identity_token_invalid'));
});

test('email is optional, never normalized, and cannot be verified while absent', async () => {
  const f = await fixture();
  const noEmail = await f.client.verifyIdentityToken(await f.sign({}, ['email', 'email_verified']), context);
  assert.equal(noEmail.email, null);
  assert.equal(noEmail.emailVerified, false);
  const mixed = await f.client.verifyIdentityToken(await f.sign({ email: 'Person@Example.test', email_verified: false }), context);
  assert.equal(mixed.email, 'Person@Example.test');
  assert.equal(mixed.emailVerified, false);
  await assert.rejects(f.client.verifyIdentityToken(await f.sign({}, ['email']), context), hasCode('identity_token_invalid'));
});

test('does not conflate identical emails and different issuer subjects', async () => {
  const f = await fixture();
  const first = await f.client.verifyIdentityToken(await f.sign({ sub: 'one' }), context);
  const second = await f.client.verifyIdentityToken(await f.sign({ sub: 'two' }), context);
  assert.equal(first.email, second.email);
  assert.notEqual(first.subject, second.subject);
});

for (const header of [
  { typ: 'at+jwt' },
  { jku: 'https://attacker.example.test/jwks' },
  { x5u: 'https://attacker.example.test/cert' },
  { jwk: { kty: 'EC' } },
  { kid: '' },
]) {
  test(`rejects forbidden ID token header ${JSON.stringify(header)}`, async () => {
    const f = await fixture();
    await assert.rejects(f.client.verifyIdentityToken(await f.sign({}, [], header), context), hasCode('identity_token_invalid'));
    assert.equal(f.calls.length, 0);
  });
}

test('rejects an otherwise valid token signed with a different private key', async () => {
  const f = await fixture();
  const other = await generateKeyPair('ES256');
  const token = await new SignJWT(f.payload()).setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).sign(other.privateKey);
  await assert.rejects(f.client.verifyIdentityToken(token, context), hasCode('identity_token_invalid'));
});

test('rejects alg=none, symmetric algorithm confusion, bad serialization, and bad base64', async () => {
  const f = await fixture();
  const symmetric = await new SignJWT(f.payload()).setProtectedHeader({ alg: 'HS256', kid: 'test-key' }).sign(new Uint8Array(32));
  for (const token of [symmetric, 'eyJhbGciOiJub25lIn0.e30.', 'a.b.c.d', 'not-a-jwt', 'e30=.e30.AAAA', 'x'.repeat(16385)]) {
    await assert.rejects(f.client.verifyIdentityToken(token, context), hasCode('identity_token_invalid'));
  }
});

test('rejects duplicate JWT claim names even in a locally signed token', async () => {
  const f = await fixture();
  const raw = JSON.stringify(f.payload()).replace('"sub":"synthetic-subject-123"', '"sub":"first","sub":"synthetic-subject-123"');
  const token = await new CompactSign(new TextEncoder().encode(raw)).setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).sign(f.keys.privateKey);
  await assert.rejects(f.client.verifyIdentityToken(token, context), hasCode('identity_token_invalid'));
});

test('rejects expired ID token and missing MFA through the COMPLETE callback path', async () => {
  for (const mode of ['expired', 'mfa'] as const) {
    const f = await fixture();
    const start = await f.start();
    if (mode === 'expired') f.faults.tokenClaims = { iat: NOW - 121, exp: NOW - 1 };
    else f.faults.omitClaims = ['amr'];
    const cookies = collector();
    await assert.rejects(f.client.completeAuthorization(start.callback, start.cookie, cookies.response), hasCode(mode === 'expired' ? 'identity_token_invalid' : 'assurance_insufficient'));
    assert.match(cookies.values[0]!, /Max-Age=0/u);
  }
});

test('a token that expires during asynchronous key resolution is not accepted', async () => {
  const f = await fixture();
  const token = await f.sign({ exp: NOW + 1 });
  f.faults.jwks = async () => { f.clock.seconds += 2; return f.keys.publicKey; };
  await assert.rejects(f.client.verifyIdentityToken(token, context), hasCode('identity_token_invalid'));
});

test('a caller cannot change the expected nonce during verification', async () => {
  const f = await fixture();
  const expected = { ...context };
  const token = await f.sign();
  f.faults.jwks = async () => { expected.nonce = 'changed'; return f.keys.publicKey; };
  await f.client.verifyIdentityToken(token, expected);
});

for (const algorithm of ['RS256', 'PS256', 'EdDSA'] as const) {
  test(`accepts explicitly configured ${algorithm} through jose 6 verification`, async () => {
    const f = await fixture();
    const keys = await generateKeyPair(algorithm);
    const client = createIdentityBridge({ ...f.cfg, idTokenAlgorithms: [algorithm] }, {
      consumeFlow: async () => true, now: () => NOW * 1000, jwks: async () => keys.publicKey,
    });
    const token = await new SignJWT(f.payload()).setProtectedHeader({ alg: algorithm, kid: 'synthetic-key', typ: 'JWT' }).sign(keys.privateKey);
    const identity = await client.verifyIdentityToken(token, context);
    assert.equal(identity.subject, 'synthetic-subject-123');
  });
}

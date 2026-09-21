import { errors, jwtVerify } from 'jose';
import type { JWTVerifyGetKey, JWTPayload } from 'jose';
import type { Config } from './config.js';
import { fail, IdentityBridgeError } from './errors.js';
import { deadline } from './http.js';
import type { Identity, VerificationContext, VerifiedAssurance } from './types.js';
import { boundedString, constantTimeEqual, decodeBase64Url, isRandomValue, numericDate, parseJsonObject, safeReturnTo, utf8 } from './validation.js';

/** Parse only to reject ambiguous syntax; no claim is trusted before jwtVerify succeeds. */
function checkCompactToken(token: unknown, config: Config): asserts token is string {
  if (typeof token !== 'string' || token.length === 0 || token.length > 16384) fail('identity_token_invalid');
  const segments = token.split('.');
  if (segments.length !== 3) fail('identity_token_invalid');
  const header = parseJsonObject(utf8(decodeBase64Url(segments[0], 'identity_token_invalid', 2048), 'identity_token_invalid'), 'identity_token_invalid');
  parseJsonObject(utf8(decodeBase64Url(segments[1], 'identity_token_invalid', 12288), 'identity_token_invalid'), 'identity_token_invalid');
  decodeBase64Url(segments[2], 'identity_token_invalid', 1024);
  if (!config.idTokenAlgorithms.some((alg) => header.alg === alg) || !boundedString(header.kid, 128)) fail('identity_token_invalid');
  if (header.typ !== undefined && header.typ !== 'JWT' && header.typ !== 'application/jwt') fail('identity_token_invalid');
  // Never consult header-supplied keys/URLs, unencoded payloads, or critical extensions.
  if (['jku', 'jwk', 'x5u', 'x5c', 'crit', 'b64'].some((key) => Object.hasOwn(header, key))) fail('identity_token_invalid');
}

function assurance(payload: JWTPayload, config: Config): { amr: readonly string[]; assurance: VerifiedAssurance } {
  if (payload.amr === undefined || payload.acr === undefined || payload.auth_time === undefined) fail('assurance_insufficient');
  if (!Array.isArray(payload.amr) || payload.amr.length === 0 || payload.amr.length > 16 || !payload.amr.every((entry: unknown) => boundedString(entry, 64)) || !boundedString(payload.acr, 256)) fail('identity_token_invalid');
  const amr = payload.amr as string[];
  if (new Set(amr).size !== amr.length) fail('identity_token_invalid');
  const acr = payload.acr;
  const passkey = config.assurance.passkeyUv;
  const passwordOtp = config.assurance.passwordOtp;
  let kind: VerifiedAssurance['kind'];
  if (passkey?.acrValues.includes(acr) && amr.includes(passkey.methodAmr) && amr.includes(passkey.userVerificationAmr)) {
    kind = 'passkey-uv';
  } else if (passwordOtp?.acrValues.includes(acr) && amr.includes('pwd') && amr.includes('otp')) {
    kind = 'pwd-otp';
  } else {
    fail('assurance_insufficient');
  }
  return { amr: Object.freeze([...amr]), assurance: Object.freeze({ kind, acr }) };
}

function validateAudiences(payload: JWTPayload, config: Config): void {
  const values: unknown[] = typeof payload.aud === 'string' ? [payload.aud] : Array.isArray(payload.aud) ? payload.aud : [];
  const trusted = [config.clientId, ...config.additionalTrustedAudiences];
  if (values.length === 0 || values.length > 9 || !values.every((value) => boundedString(value, 128) && trusted.includes(value)) ||
      new Set(values).size !== values.length || !values.includes(config.clientId)) fail('identity_token_invalid');
  if ((values.length > 1 && payload.azp !== config.clientId) || (payload.azp !== undefined && payload.azp !== config.clientId)) fail('identity_token_invalid');
}

export async function verifyToken(
  config: Config,
  token: string,
  context: VerificationContext,
  getResolver: () => Promise<JWTVerifyGetKey>,
  now: () => number,
): Promise<Identity> {
  if (!context || !isRandomValue(context.nonce) || typeof context.returnTo !== 'string') fail('identity_token_invalid');
  // Snapshot expectations before any await; callers cannot change the nonce during verification.
  const nonce = context.nonce;
  const returnTo = safeReturnTo(context.returnTo);
  checkCompactToken(token, config);
  const resolver = await getResolver();
  const boundedResolver: JWTVerifyGetKey = (header, input) => deadline(async () => {
    try { return await resolver(header, input); } catch (error) {
      if (error instanceof errors.JWKSNoMatchingKey || error instanceof errors.JWKSMultipleMatchingKeys) fail('identity_token_invalid');
      if (error instanceof IdentityBridgeError) throw error;
      fail('dependency_unavailable');
    }
  }, config.requestTimeoutMs);

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, boundedResolver, {
      algorithms: [...config.idTokenAlgorithms],
      issuer: config.issuer,
      audience: config.clientId,
      requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', 'nonce'],
      clockTolerance: 0,
      currentDate: new Date(now() * 1000),
    }));
  } catch (error) {
    if (error instanceof IdentityBridgeError) throw error;
    fail('identity_token_invalid');
  }
  // Recheck time after asynchronous key retrieval: a token may expire while JWKS is loading.
  const timestamp = now();
  if (payload.iss !== config.issuer || !boundedString(payload.sub, 255) || !/^[\x21-\x7e]+$/u.test(payload.sub) ||
      typeof payload.nonce !== 'string' || !constantTimeEqual(payload.nonce, nonce) ||
      !numericDate(payload.iat) || !numericDate(payload.exp) || payload.iat > timestamp || payload.exp <= timestamp ||
      payload.exp <= payload.iat || payload.exp - payload.iat > config.maxIdTokenLifetimeSeconds ||
      timestamp - payload.iat > config.maxIdTokenLifetimeSeconds ||
      (payload.nbf !== undefined && (!numericDate(payload.nbf) || payload.nbf > timestamp || payload.nbf >= payload.exp))) fail('identity_token_invalid');
  validateAudiences(payload, config);
  const evidence = assurance(payload, config);
  if (!numericDate(payload.auth_time) || payload.auth_time > timestamp || payload.auth_time > payload.iat) fail('identity_token_invalid');
  if (timestamp - payload.auth_time > config.maxAuthenticationAgeSeconds) fail('authentication_stale');

  let email: string | null = null;
  if (payload.email !== undefined) {
    if (!boundedString(payload.email, 254) || !/^[^@\s]+@[^@\s]+$/u.test(payload.email)) fail('identity_token_invalid');
    email = payload.email;
  }
  if (payload.email_verified !== undefined && typeof payload.email_verified !== 'boolean') fail('identity_token_invalid');
  const emailVerified = payload.email_verified === true;
  if (emailVerified && email === null) fail('identity_token_invalid');

  return Object.freeze({
    issuer: config.issuer,
    subject: payload.sub,
    email,
    emailVerified,
    authTime: payload.auth_time,
    amr: evidence.amr,
    assurance: evidence.assurance,
    mfaVerifiedAt: new Date(payload.auth_time * 1000).toISOString(),
    returnTo,
  });
}

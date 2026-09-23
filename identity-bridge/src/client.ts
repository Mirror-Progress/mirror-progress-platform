import { parseCallback } from './callback.js';
import { validateConfig } from './config.js';
import { createProvider } from './discovery.js';
import { fail } from './errors.js';
import { cookieName, createFlow, openFlow, pkceChallenge, readFlowCookie, replayKey, sealFlow, writeFlowCookie } from './flow.js';
import { deadline, fetchJson } from './http.js';
import { verifyToken } from './token.js';
import type { BridgeDependencies, IdentityBridge, OidcClientConfig } from './types.js';
import { boundedString, numericDate, safeReturnTo } from './validation.js';

function formComponent(value: string): string {
  // RFC 6749 section 2.3.1: form-encode EACH credential before joining with ':' and base64.
  return new URLSearchParams({ v: value }).toString().slice(2);
}

export function createIdentityBridge(input: OidcClientConfig, dependencies: BridgeDependencies): IdentityBridge {
  const config = validateConfig(input);
  if (!dependencies || typeof dependencies.consumeFlow !== 'function' ||
      (dependencies.fetch !== undefined && typeof dependencies.fetch !== 'function') ||
      (dependencies.jwks !== undefined && typeof dependencies.jwks !== 'function') ||
      (dependencies.now !== undefined && typeof dependencies.now !== 'function')) fail('configuration_invalid');
  const fetcher = dependencies.fetch ?? ((url, init) => globalThis.fetch(url, init));
  const consumeFlow = dependencies.consumeFlow;
  const clock = dependencies.now ?? Date.now;
  const now = () => {
    let milliseconds: number;
    try { milliseconds = clock(); } catch { fail('dependency_unavailable'); }
    const seconds = Math.floor(milliseconds / 1000);
    if (!Number.isSafeInteger(milliseconds) || !numericDate(seconds)) fail('dependency_unavailable');
    return seconds;
  };
  const provider = createProvider(config, fetcher, now, dependencies.jwks);

  return Object.freeze<IdentityBridge>({
    async beginAuthorization(request, cookies) {
      if (!request || request.method !== 'GET') fail('request_invalid');
      const returnTo = safeReturnTo(request.returnTo);
      const metadata = await provider.metadata();
      const flow = createFlow(config, returnTo, now());
      const url = new URL(metadata.authorizationEndpoint);
      const parameters = new URLSearchParams({
        response_type: 'code',
        response_mode: 'query',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: 'openid email',
        state: flow.state,
        nonce: flow.nonce,
        code_challenge: pkceChallenge(flow.verifier),
        code_challenge_method: 'S256',
        max_age: String(config.maxAuthenticationAgeSeconds),
        acr_values: config.acrValues.join(' '),
        claims: JSON.stringify({ id_token: {
          auth_time: { essential: true },
          amr: { essential: true },
          acr: { essential: true, values: config.acrValues },
        } }),
      });
      if (config.assurance.mirrorV1) {
        for (const key of ['response_mode', 'max_age', 'acr_values', 'claims']) parameters.delete(key);
      }
      url.search = parameters.toString();
      writeFlowCookie(config, cookies, flow.state, sealFlow(config, flow));
      return Object.freeze({ authorizationUrl: url.href, state: flow.state });
    },

    async completeAuthorization(callback, flowCookie, cookies) {
      const incoming = parseCallback(config, callback);
      // A validly shaped callback has an unambiguous state. Clear only that flow, including failures.
      writeFlowCookie(config, cookies, incoming.state, '', true);
      const flow = openFlow(config, incoming.state, flowCookie, now());
      const consumed = await deadline((signal) => consumeFlow(replayKey(config, incoming.state), flow.expiresAt, signal), config.requestTimeoutMs);
      if (typeof consumed !== 'boolean') fail('dependency_unavailable');
      if (!consumed) fail('flow_replayed');
      if (incoming.error !== undefined) fail('authorization_denied');
      if (incoming.code === undefined) fail('callback_invalid');
      const metadata = await provider.metadata();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: incoming.code,
        redirect_uri: flow.redirectUri,
        code_verifier: flow.verifier,
      });
      const headers = new Headers({ 'content-type': 'application/x-www-form-urlencoded' });
      if (config.tokenEndpointAuthMethod === 'client_secret_basic') {
        const credentials = `${formComponent(config.clientId)}:${formComponent(config.clientSecret)}`;
        headers.set('authorization', `Basic ${Buffer.from(credentials, 'utf8').toString('base64')}`);
      } else {
        body.set('client_id', config.clientId);
        if (config.tokenEndpointAuthMethod !== 'none') body.set('client_secret', config.clientSecret);
      }
      const tokens = await fetchJson(fetcher, metadata.tokenEndpoint, { method: 'POST', headers, body: body.toString() }, config.requestTimeoutMs, 'token_exchange_failed', 32768);
      if (Object.hasOwn(tokens, 'error') || !boundedString(tokens.id_token, 16384) || !boundedString(tokens.access_token, 8192) ||
          typeof tokens.token_type !== 'string' || tokens.token_type.toLowerCase() !== 'bearer') fail('token_exchange_failed');
      const identity = await verifyToken(config, tokens.id_token, { nonce: flow.nonce, returnTo: flow.returnTo,
        accessToken: tokens.access_token, code: incoming.code, state: incoming.state }, () => provider.resolver(metadata), now);
      if (flow.expiresAt <= now()) fail('flow_expired');
      // Access/refresh tokens and all non-allowlisted claims are intentionally discarded.
      return identity;
    },

    verifyIdentityToken(token, context) {
      return verifyToken(config, token, context, () => provider.resolver(), now);
    },
    flowCookieName(state) { return cookieName(config, state); },
    readFlowCookie(header, state) { return readFlowCookie(config, header, state); },
  });
}

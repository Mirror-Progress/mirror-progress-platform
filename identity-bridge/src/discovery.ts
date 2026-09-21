import { createRemoteJWKSet, customFetch } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { endpointUrl } from './config.js';
import type { Config } from './config.js';
import { fail } from './errors.js';
import { fetchJson } from './http.js';
import type { Fetch } from './types.js';

export interface Metadata {
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  readonly jwksUri: string;
}

function supported(value: unknown, required: readonly string[], optional = false): boolean {
  if (value === undefined && optional) return true;
  return Array.isArray(value) && value.length <= 64 && value.every((entry: unknown) => typeof entry === 'string') && required.every((entry) => value.includes(entry));
}

export function createProvider(config: Config, fetcher: Fetch, now: () => number, injected?: JWTVerifyGetKey) {
  let cached: { value: Metadata; loadedAt: number; expiresAt: number } | undefined;
  let pending: Promise<Metadata> | undefined;
  let remote: { url: string; resolver: JWTVerifyGetKey } | undefined;

  async function metadata(): Promise<Metadata> {
    const timestamp = now();
    if (cached && timestamp >= cached.loadedAt && timestamp < cached.expiresAt) return cached.value;
    if (pending) return pending;
    pending = (async () => {
      const document = await fetchJson(fetcher, config.discoveryUrl, { method: 'GET' }, config.requestTimeoutMs, 'discovery_invalid');
      if (document.issuer !== config.issuer ||
          !supported(document.response_types_supported, ['code']) ||
          !supported(document.code_challenge_methods_supported, ['S256']) ||
          !supported(document.id_token_signing_alg_values_supported, config.idTokenAlgorithms) ||
          !supported(document.grant_types_supported, ['authorization_code'], true) ||
          !supported(document.response_modes_supported, ['query'], true) ||
          !supported(document.scopes_supported, ['openid', 'email'], true) ||
          !supported(document.token_endpoint_auth_methods_supported === undefined ? ['client_secret_basic'] : document.token_endpoint_auth_methods_supported, [config.tokenEndpointAuthMethod]) ||
          document.authorization_response_iss_parameter_supported !== true) fail('discovery_invalid');
      const value: Metadata = Object.freeze({
        authorizationEndpoint: endpointUrl(document.authorization_endpoint, config),
        tokenEndpoint: endpointUrl(document.token_endpoint, config),
        jwksUri: endpointUrl(document.jwks_uri, config),
      });
      const loadedAt = now();
      cached = { value, loadedAt, expiresAt: loadedAt + 300 };
      return value;
    })();
    try { return await pending; } finally { pending = undefined; }
  }

  async function resolver(known?: Metadata): Promise<JWTVerifyGetKey> {
    if (injected) return injected;
    const value = known ?? await metadata();
    if (!remote || remote.url !== value.jwksUri) {
      const jwksUrl = value.jwksUri;
      const resolve = createRemoteJWKSet(new URL(jwksUrl), {
        timeoutDuration: config.requestTimeoutMs,
        cooldownDuration: 30000,
        cacheMaxAge: 300000,
        [customFetch]: async (url) => {
          if (url !== jwksUrl) fail('dependency_unavailable');
          // Fully consume and bound the original stream before jose parses a safe in-memory copy.
          const json = await fetchJson(fetcher, jwksUrl, { method: 'GET' }, config.requestTimeoutMs, 'dependency_unavailable', 65536, true);
          if (!Array.isArray(json.keys) || json.keys.length === 0 || json.keys.length > 32) fail('dependency_unavailable');
          return new Response(JSON.stringify(json), { status: 200, headers: { 'content-type': 'application/json' } });
        },
      });
      remote = { url: jwksUrl, resolver: resolve };
    }
    return remote.resolver;
  }

  return { metadata, resolver };
}

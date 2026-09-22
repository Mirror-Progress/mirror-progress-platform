import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { localOidcMetadata } from "./core/metadata.js";
import { hashPassword } from "better-auth/crypto";
import type { Config } from "./core/config.js";
import { PolicyError, assertOrdinaryPrincipal, validateAuthorizationQuery } from "./core/policy.js";
import { cleanAuthHeaders, cookieValue, responseCookies, verifiedTotpDigest } from "./core/tokens.js";
import { ceremony } from "./auth.js";
import type { MirrorAuth } from "./auth.js";
import { Store } from "./db.js";
import type { SessionIdentity } from "./db.js";

const FLOW_COOKIE = "mirror_identity.password_flow";
const TWO_FACTOR_COOKIE = "mirror_identity.two_factor";
const flowCookie = (value: string, maxAge = 300): string =>
  `${FLOW_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
function json(data: unknown, status = 200, headers?: Headers): Response {
  const h = new Headers(headers);
  h.delete("content-length");
  h.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: h });
}
function errorResponse(error: unknown): Response {
  if (error instanceof PolicyError) return json({ error: error.code }, error.status);
  // Never emit exception text, PostgreSQL errors, credentials, URLs, or tokens.
  return json({ error: "request_failed" }, 500);
}
function harden(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("content-security-policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  headers.set("permissions-policy", "publickey-credentials-get=(self), publickey-credentials-create=(self)");
  return new Response(response.body, { status: response.status, headers });
}
async function readObject(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new PolicyError("json_required", 415);
  }
  const text = await request.text();
  if (Buffer.byteLength(text) > 32_768) throw new PolicyError("body_too_large", 413);
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new PolicyError("invalid_json", 400); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PolicyError("invalid_json", 400);
  return value as Record<string, unknown>;
}
function stringField(body: Record<string, unknown>, key: string, min = 1, max = 256): string {
  const v = body[key];
  if (typeof v !== "string" || v.length < min || v.length > max) throw new PolicyError(`invalid_${key}`, 400);
  return v;
}
export function createApp(config: Config, store: Store, auth: MirrorAuth) {
  const openIdMetadata = oauthProviderOpenIdConfigMetadata(auth);
  const oauthMetadata = oauthProviderAuthServerMetadata(auth);
  const getSession = async (headers: Headers): Promise<SessionIdentity | null> => {
    const result = await auth.api.getSession({ headers: cleanAuthHeaders(headers) });
    return result;
  };
  const requiredSession = async (headers: Headers): Promise<SessionIdentity> => {
    const session = await getSession(headers);
    if (!session) throw new PolicyError("session_required", 401);
    assertOrdinaryPrincipal(await store.principal(session.user.id));
    return session;
  };
  const credentialManagement = async (identity: SessionIdentity): Promise<void> => {
    const { rows } = await store.pool.query<{ enrolled: boolean }>(`SELECT
      COALESCE(u."twoFactorEnabled",false) OR EXISTS(SELECT 1 FROM passkey p WHERE p."userId"=u.id) AS enrolled
      FROM "user" u WHERE u.id=$1`, [identity.user.id]);
    if (rows[0]?.enrolled) await store.authorize(identity.session.id, identity.user.id, 300_000);
    else await store.freshEnrollmentSession(identity);
  };
  const handle = async (request: Request, ip: string): Promise<Response> => {
  const invoke = (request: Request, path: string, body?: unknown, freshLogin = false) => {
    const headers = cleanAuthHeaders(request.headers, freshLogin);
    const url = new URL(path, config.origin);
    // No externally supplied origin, forwarded scheme, or auth callback query reaches the library.
    headers.set("origin", config.origin);
    headers.set("x-mirror-transport-ip", ip);
    if (body !== undefined) headers.set("content-type", "application/json");
    return auth.handler(new Request(url, { method: request.method, headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  };
    const url = new URL(request.url);
    if (url.origin !== config.origin) throw new PolicyError("invalid_origin", 400);
    if (request.method === "GET" && ["/", "/consent", "/app.js", "/style.css"].includes(url.pathname)) {
      const file = url.pathname === "/app.js" ? "app.js" : url.pathname === "/style.css" ? "style.css" : "index.html";
      const data = await readFile(join(process.cwd(), "public", file));
      return new Response(new Uint8Array(data), { headers: {
        "content-type": file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html; charset=utf-8",
      } });
    }
    if (request.method === "GET" && url.pathname === "/health/live") return json({ status: "live", mode: "synthetic" });
    if (request.method === "GET" && url.pathname === "/health/ready") {
      await store.pool.query('SELECT id FROM "user" LIMIT 0');
      await store.pool.query("SELECT session_id FROM mirror_assurance LIMIT 0");
      return json({ status: "local-foundation", productionReady: false });
    }
    await store.rateLimit(`ip:${ip}`, 60);
    const origin = request.headers.get("origin");
    const tokenExchange = url.pathname === "/api/auth/oauth2/token";
    if (request.method !== "GET" && request.method !== "HEAD" &&
        (origin !== config.origin && !(tokenExchange && origin === null))) {
      throw new PolicyError("same_origin_required");
    }
    if (request.headers.get("sec-fetch-site") === "cross-site" && !tokenExchange && request.method !== "GET") {
      throw new PolicyError("cross_site_request_denied");
    }
    if (request.method === "POST" && url.pathname === "/api/identity/enroll") {
      const body = await readObject(request);
      if (Object.keys(body).some((key) => !["invitation", "name", "password"].includes(key))) {
        throw new PolicyError("unexpected_enrollment_field", 400);
      }
      const password = stringField(body, "password", 14, 128);
      const name = stringField(body, "name", 1, 120).trim();
      if (!name) throw new PolicyError("invalid_name", 400);
      await store.rateLimit(`enroll:${ip}`, 5);
      await store.enroll(body.invitation, name, await hashPassword(password));
      return json({ enrolled: true, mfaCompleted: false, emailVerified: false,
        next: "Sign in with your password, enroll TOTP or a passkey, then perform a fresh authentication." }, 201);
    }
    if (request.method === "GET" && url.pathname === "/api/identity/session") {
      const identity = await requiredSession(request.headers);
      try {
        const { principal, evidence } = await store.authorize(identity.session.id, identity.user.id);
        return json({ authenticated: true, mfaCompleted: true, principalId: principal.id,
          assurance: { method: evidence.factor, verifiedAt: evidence.mfaAt, expiresAt: evidence.expiresAt } });
      } catch (error) {
        if (!(error instanceof PolicyError)) throw error;
        return json({ authenticated: true, mfaCompleted: false, reason: error.code });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/identity/global-logout") {
      const identity = await requiredSession(request.headers);
      // Even a password-only session may reduce its own access, never increase it.
      await store.revoke(identity.user.id, "global_logout");
      const headers = new Headers(); headers.append("set-cookie", flowCookie("", 0));
      return json({ revoked: true, downstreamInvalidation: "queued-not-delivered" }, 200, headers);
    }
    if (request.method === "GET" && url.pathname === "/api/auth/oauth2/authorize") {
      validateAuthorizationQuery(url.searchParams, { id: config.oidcClientId, redirectUris: config.redirectUris });
      const identity = await getSession(request.headers);
      if (!identity) return new Response(null, { status: 303,
        headers: { location: `/?resume=${encodeURIComponent(url.pathname + url.search)}` } });
      await store.authorize(identity.session.id, identity.user.id);
      return invoke(request, url.pathname + url.search);
    }
    if (request.method === "POST" && url.pathname === "/api/auth/oauth2/token") {
      if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
        throw new PolicyError("form_required", 415);
      }
      const form = new URLSearchParams(await request.text());
      const allowed = new Set(["grant_type", "client_id", "redirect_uri", "code", "code_verifier"]);
      for (const key of form.keys()) if (!allowed.has(key) || form.getAll(key).length !== 1) {
        throw new PolicyError("invalid_token_request", 400);
      }
      if (form.get("grant_type") !== "authorization_code" || form.get("client_id") !== config.oidcClientId ||
          !config.redirectUris.includes(form.get("redirect_uri") ?? "") ||
          !/^[A-Za-z0-9._~-]{43,128}$/.test(form.get("code_verifier") ?? "")) {
        throw new PolicyError("invalid_token_request", 400);
      }
      // The library owns code consumption, client validation, PKCE verification and token signatures.
      return auth.handler(new Request(config.origin + url.pathname, { method: "POST", headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-mirror-transport-ip": ip,
      }, body: form.toString() }));
    }
    if (request.method === "GET" && ["/api/auth/.well-known/openid-configuration",
      "/api/auth/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/api/auth"].includes(url.pathname)) {
      const response = await (url.pathname.endsWith("openid-configuration") ? openIdMetadata : oauthMetadata)(request);
      if (!response.ok) return response;
      return json(localOidcMetadata(await response.json() as Record<string, unknown>));
    }
    if (request.method === "GET" && url.pathname === "/api/auth/jwks") return invoke(request, url.pathname);
    if (request.method === "POST" && url.pathname === "/api/auth/oauth2/consent") {
      const identity = await requiredSession(request.headers);
      await store.authorize(identity.session.id, identity.user.id);
      const body = await readObject(request);
      // No /oauth2/continue route is exposed. It cannot skip the outer authorization gate.
      return invoke(request, url.pathname, { accept: body.accept === true, code: stringField(body, "code", 1, 2048) });
    }
    if (request.method === "POST" && url.pathname === "/api/auth/sign-in/email") {
      const body = await readObject(request);
      const email = stringField(body, "email", 3, 254).toLowerCase().trim();
      const password = stringField(body, "password", 1, 128);
      await store.rateLimit(`login-account:${email}`, 10, 300_000);
      const response = await invoke(request, url.pathname, { email, password, rememberMe: false }, true);
      if (response.status === 429) return json({ error: "authentication_rate_limited" }, 429);
      if (!response.ok) return json({ error: "invalid_authentication" }, 401);
      const passwordVerifiedAt = Date.now();
      const result = await response.clone().json() as Record<string, unknown>;
      const merged = responseCookies(new Headers(), response.headers);
      if (result.twoFactorRedirect === true) {
        const authCookie = cookieValue(merged, TWO_FACTOR_COOKIE);
        if (!authCookie) throw new PolicyError("password_challenge_binding_unavailable", 503);
        const flow = await store.beginPasswordFlow(email, authCookie, passwordVerifiedAt);
        const headers = new Headers(response.headers); headers.append("set-cookie", flowCookie(flow));
        return json({ twoFactorRedirect: true }, 200, headers);
      }
      const identity = await requiredSession(merged);
      await store.recordEvidence(identity, null, passwordVerifiedAt, null);
      // Never expose raw session tokens in browser JSON, even when the upstream API includes them.
      return json({ authenticated: true, mfaCompleted: false }, 200, response.headers);
    }
    if (request.method === "POST" && url.pathname === "/api/auth/two-factor/enable") {
      const identity = await requiredSession(request.headers);
      await credentialManagement(identity);
      const body = await readObject(request);
      return invoke(request, url.pathname, { password: stringField(body, "password", 1, 128), method: "totp", issuer: "Mirror Identity" });
    }
    if (request.method === "POST" && ["/api/auth/two-factor/verify-totp", "/api/auth/two-factor/verify-backup-code"].includes(url.pathname)) {
      const body = await readObject(request);
      const code = stringField(body, "code", 1, 128);
      const recovery = url.pathname.endsWith("verify-backup-code");
      const existing = await getSession(request.headers);
      if (existing && !recovery) {
        await credentialManagement(existing);
        const { rows } = await store.pool.query<{ enabled: boolean }>('SELECT "twoFactorEnabled" AS enabled FROM "user" WHERE id=$1', [existing.user.id]);
        if (rows[0]?.enabled) throw new PolicyError("fresh_password_login_required", 401);
        // This is TOTP ENROLLMENT confirmation only. Do not create or upgrade assurance.
        const response = await invoke(request, url.pathname, { code, trustDevice: false });
        if (!response.ok) return json({ error: "invalid_factor" }, 401, response.headers);
        await store.reserveVerifiedTotp(existing.user.id, verifiedTotpDigest(config.secret, existing.user.id, code));
        return json({ registered: true, mfaCompleted: false, next: "Sign out and complete a fresh login with a new TOTP code." }, 200, response.headers);
      }
      const flow = await store.consumePasswordFlow(cookieValue(request.headers, FLOW_COOKIE), cookieValue(request.headers, TWO_FACTOR_COOKIE));
      // Consumed before verification: failures require a fresh password login, so flows cannot be replayed.
      const response = await invoke(request, url.pathname, { code, trustDevice: false });
      const headers = new Headers(response.headers); headers.append("set-cookie", flowCookie("", 0));
      if (!response.ok) return json({ error: "invalid_factor_restart_password_login" }, 401, headers);
      const identity = await requiredSession(responseCookies(request.headers, response.headers));
      if (identity.user.id !== flow.userId) throw new PolicyError("factor_subject_mismatch", 401);
      if (recovery) {
        await store.revoke(identity.user.id, "recovery");
        return json({ recovered: false, sessionsRevoked: true, mfaCompleted: false,
          next: "Assisted credential recovery is not implemented in batch 1.", downstreamInvalidation: "queued-not-delivered" }, 200, headers);
      }
      await store.recordEvidence(identity, "password_totp", flow.passwordAt, Date.now(), flow.epoch,
        verifiedTotpDigest(config.secret, identity.user.id, code));
      return json({ authenticated: true, mfaCompleted: true }, 200, headers);
    }
    const passkeyPaths = new Map([
      ["/api/auth/passkey/generate-register-options", "GET"],
      ["/api/auth/passkey/verify-registration", "POST"],
      ["/api/auth/passkey/generate-authenticate-options", "GET"],
      ["/api/auth/passkey/verify-authentication", "POST"],
    ]);
    if (passkeyPaths.get(url.pathname) === request.method) {
      const registration = url.pathname.includes("register-options") || url.pathname.endsWith("verify-registration");
      if (registration) await credentialManagement(await requiredSession(request.headers));
      const body = request.method === "POST" ? await readObject(request) : undefined;
      const scope: { passkeyVerifiedAt?: number } = {};
      const response = await ceremony.run(scope, () => invoke(request, url.pathname + url.search, body));
      if (response.ok && url.pathname.endsWith("verify-authentication")) {
        if (scope.passkeyVerifiedAt === undefined) throw new PolicyError("verified_passkey_ceremony_missing", 401);
        const identity = await requiredSession(responseCookies(request.headers, response.headers));
        await store.recordEvidence(identity, "passkey_uv", null, scope.passkeyVerifiedAt);
        // passkeyClient expects the session/user shape; remove only bearer material.
        const data = await response.clone().json() as Record<string, unknown>;
        if (data.session && typeof data.session === "object") delete (data.session as Record<string, unknown>).token;
        delete data.token;
        return json(data, 200, response.headers);
      }
      return response;
    }
    if (request.method === "POST" && url.pathname === "/api/auth/sign-out") {
      await store.cancelPasswordFlow(cookieValue(request.headers, FLOW_COOKIE));
      const response = await invoke(request, url.pathname, {});
      const headers = new Headers(response.headers); headers.append("set-cookie", flowCookie("", 0));
      return new Response(response.body, { status: response.status, headers });
    }
    // Deny-by-default boundary: blocks signup, email delivery, resets, client CRUD,
    // factor deletion, session listing, bearer JWT minting, DCR, refresh and future plugin routes.
    return json({ error: "route_not_exposed" }, 404);
  };
  return async (request: Request, ip = "127.0.0.1"): Promise<Response> => {
    try { return harden(await handle(request, ip)); }
    catch (error) { return harden(errorResponse(error)); }
  };
}

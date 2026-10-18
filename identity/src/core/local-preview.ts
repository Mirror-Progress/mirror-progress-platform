import { appendFileSync, chmodSync } from "node:fs";
import { isAbsolute } from "node:path";
import type { Config } from "./config.js";
import { selfServeSecret, sessionStatusSecret } from "./config.js";
import type { EnrollmentMessage, EnrollmentTransport } from "./delivery.js";
import { invitationEmail } from "./invitation-email.js";

/**
 * LOCAL PREVIEW ONLY. Runs the production fresh-install policy (managed and self-serve
 * invitations, passkeys, OIDC) on a developer machine against a loopback PostgreSQL,
 * with invitation mail captured to a local file instead of being sent.
 *
 * Every entry point requires all of: NODE_ENV other than "production" (the service image
 * sets NODE_ENV=production), IDENTITY_LOCAL_PREVIEW=1, no IDENTITY_MODE (the hosted
 * loaders own that variable), a loopback database named mirror_identity_local_preview,
 * and loopback origins. server.ts never imports the launcher.
 */
export const LOCAL_PREVIEW_ORIGIN = "http://localhost:3040";
export const LOCAL_PREVIEW_DATABASE = "mirror_identity_local_preview";
export const LOCAL_PREVIEW_RUNTIME_ROLE = "mirror_identity_local_preview_runtime";
export const LOCAL_PREVIEW_CLIENT_ID = "mirror-local-preview";
const LOOPBACK = new Set(["localhost", "127.0.0.1"]);

export function localPreviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== "production" && env.IDENTITY_LOCAL_PREVIEW === "1" && env.IDENTITY_MODE === undefined;
}

function assertEnabled(env: NodeJS.ProcessEnv): void {
  if (!localPreviewEnabled(env)) throw new Error("local_preview_disabled");
}

export function localPreviewDatabase(url: string, runtime: boolean): URL {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("local_preview_database_required"); }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !LOOPBACK.has(parsed.hostname) ||
      parsed.pathname !== `/${LOCAL_PREVIEW_DATABASE}` || !parsed.password || parsed.search || parsed.hash ||
      (runtime ? parsed.username !== LOCAL_PREVIEW_RUNTIME_ROLE : parsed.username === LOCAL_PREVIEW_RUNTIME_ROLE)) {
    throw new Error("local_preview_database_required");
  }
  return parsed;
}

export function localPreviewPlatformOrigin(value: string | undefined): string {
  let parsed: URL;
  try { parsed = new URL(value ?? ""); } catch { throw new Error("local_preview_platform_origin_required"); }
  if (parsed.protocol !== "http:" || !LOOPBACK.has(parsed.hostname) || parsed.origin !== value) {
    throw new Error("local_preview_platform_origin_required");
  }
  return parsed.origin;
}

/** A production fresh-install policy profile bound to loopback origins only. */
export function localPreviewConfig(env: NodeJS.ProcessEnv = process.env): Config {
  assertEnabled(env);
  const databaseUrl = env.DATABASE_URL ?? "";
  localPreviewDatabase(databaseUrl, true);
  const secret = env.BETTER_AUTH_SECRET ?? "";
  if (secret.length < 48 || /replace|placeholder|change[-_]?me/i.test(secret)) throw new Error("strong_auth_secret_required");
  const deliveryKey = env.IDENTITY_DELIVERY_KEY ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(deliveryKey) || Buffer.from(deliveryKey, "base64url").length !== 32 || deliveryKey === secret) {
    throw new Error("separate_delivery_key_required");
  }
  const status = sessionStatusSecret(env);
  if (!status) throw new Error("session_status_secret_required");
  const platformOrigin = localPreviewPlatformOrigin(env.IDENTITY_PLATFORM_ORIGIN);
  return { mode: "production", freshInstall: true, origin: LOCAL_PREVIEW_ORIGIN, databaseUrl, secret,
    bindHost: "127.0.0.1", port: 3040, sessionStatusSecret: status, selfServeSecret: selfServeSecret(env), platformOrigin,
    oidcClientId: LOCAL_PREVIEW_CLIENT_ID, redirectUris: [`${platformOrigin}/api/auth/callback`],
    staging: { rpId: "localhost", deliveryKey, certFile: "/local-preview/no-tls", keyFile: "/local-preview/no-tls" } };
}

type CapturedMessage = { kind: "invitation" | "password_reset"; to: string; url: string; name?: string; company?: string; expiresAt?: string;
  invitationKind?: string; subject?: string; text?: string; html?: string };

/**
 * Writes captured mail (including the one-time link) to a mode-0600 JSON-lines file.
 * It refuses any link whose origin is not loopback, so it can never record a link that
 * would work against a hosted identity service.
 */
export class LocalFileEnrollmentTransport implements EnrollmentTransport {
  constructor(readonly outbox: string) {
    if (!isAbsolute(outbox)) throw new Error("local_preview_outbox_must_be_absolute");
  }
  capture(message: CapturedMessage): void {
    if (!localPreviewEnabled()) throw new Error("local_preview_disabled");
    const link = new URL(message.url);
    if (link.protocol !== "http:" || !LOOPBACK.has(link.hostname)) throw new Error("local_preview_link_not_loopback");
    appendFileSync(this.outbox, JSON.stringify({ capturedAt: new Date().toISOString(), ...message }) + "\n", { mode: 0o600 });
    chmodSync(this.outbox, 0o600);
    // The link stays in the file; logs carry only the recipient.
    console.info(`Local preview: captured ${message.kind} email for ${message.to} in ${this.outbox}`);
  }
  async send(message: EnrollmentMessage): Promise<void> {
    // The same branded message a real transport would send, rendered for the loopback link.
    const rendered = message.url.startsWith(`${LOCAL_PREVIEW_ORIGIN}/#invitation=`) ? invitationEmail({ to: message.to, name: message.inviteeName ?? "",
      company: message.company ?? "", url: message.url, expiresAt: message.expiresAt, kind: message.invitationKind },
    { origin: LOCAL_PREVIEW_ORIGIN }) : undefined;
    this.capture({ kind: "invitation", to: message.to, url: message.url, name: message.inviteeName,
      company: message.company, expiresAt: message.expiresAt.toISOString(),
      invitationKind: message.invitationKind ?? "standard", ...rendered });
  }
}

export function localPreviewTransport(env: NodeJS.ProcessEnv = process.env): LocalFileEnrollmentTransport | undefined {
  if (!localPreviewEnabled(env) || env.IDENTITY_MAIL_DELIVERY !== "local-file" || !env.IDENTITY_LOCAL_PREVIEW_OUTBOX) return undefined;
  return new LocalFileEnrollmentTransport(env.IDENTITY_LOCAL_PREVIEW_OUTBOX);
}

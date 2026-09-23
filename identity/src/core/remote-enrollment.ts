import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const REMOTE_ENROLL_EMAIL = "ronniemack@mirrorprogress.com";
export const REMOTE_LINK_MS = 15 * 60_000;
export const REMOTE_GRANT_MS = 5 * 60_000;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

const digest = (value: string): string => createHash("sha256").update(value).digest("hex");

export function remoteIssueKey(userId: string, token: string): string | null {
  if (!userId || !tokenPattern.test(token)) return null;
  return digest(JSON.stringify(["mirror-remote-passkey-issue-v1", userId, token]));
}

export function remoteGrantKey(nonce: string): string | null {
  if (!tokenPattern.test(nonce)) return null;
  return digest(JSON.stringify(["mirror-remote-passkey-grant-v1", nonce]));
}

export function signRemoteGrant(secret: string, userId: string, sessionId: string, nonce: string, expiresAt: number): string {
  if (!secret || !userId || !sessionId || !tokenPattern.test(nonce) || !Number.isSafeInteger(expiresAt)) {
    throw new Error("Invalid remote enrollment grant");
  }
  const payload = Buffer.from(JSON.stringify([userId, sessionId, nonce, expiresAt])).toString("base64url");
  const signature = createHmac("sha256", secret).update(`mirror-remote-passkey-grant-v1:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyRemoteGrant(secret: string, cookie: string | null, userId: string, sessionId: string, now: number): string | null {
  if (!secret || !cookie || cookie.length > 700 || !Number.isFinite(now)) return null;
  const parts = cookie.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]!) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1]!)) return null;
  const expected = createHmac("sha256", secret).update(`mirror-remote-passkey-grant-v1:${parts[0]}`).digest();
  const supplied = Buffer.from(parts[1]!, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const [boundUser, boundSession, nonce, expiresAt] = JSON.parse(Buffer.from(parts[0]!, "base64url").toString("utf8")) as unknown[];
    if (boundUser !== userId || boundSession !== sessionId || typeof nonce !== "string" || !tokenPattern.test(nonce) ||
        typeof expiresAt !== "number" || !Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + REMOTE_GRANT_MS) return null;
    return nonce;
  } catch { return null; }
}

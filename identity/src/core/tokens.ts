import { createHash, createHmac, randomBytes } from "node:crypto";
import { PolicyError } from "./policy.js";
export const opaqueToken = (): string => randomBytes(32).toString("base64url");
export const digest = (token: string): string => createHash("sha256").update(token, "utf8").digest("hex");
export function tokenDigest(token: unknown): string {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new PolicyError("invalid_invitation", 400);
  }
  return digest(token);
}
export function cookieValue(headers: Headers, name: string): string | null {
  const values = (headers.get("cookie") ?? "").split(";")
    .map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`));
  if (values.length !== 1) return null;
  return values[0]!.slice(name.length + 1);
}
/** Merge only cookie name/value pairs, never cookie attributes. No raw tokens are logged. */
export function responseCookies(requestHeaders: Headers, responseHeaders: Headers): Headers {
  const values = new Map<string, string>();
  for (const pair of (requestHeaders.get("cookie") ?? "").split(";")) {
    const at = pair.indexOf("=");
    if (at > 0) values.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
  }
  for (const cookie of responseHeaders.getSetCookie()) {
    const pair = cookie.split(";")[0]!;
    const at = pair.indexOf("=");
    if (at > 0) values.set(pair.slice(0, at), pair.slice(at + 1));
  }
  const headers = new Headers();
  headers.set("cookie", [...values].map(([k, v]) => `${k}=${v}`).join("; "));
  return headers;
}
export function cleanAuthHeaders(input: Headers, freshLogin = false): Headers {
  const headers = new Headers(input);
  headers.delete("authorization");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.delete("x-mirror-transport-ip");
  const cookies = (headers.get("cookie") ?? "").split(";").filter((pair) => {
    const name = pair.trim().split("=")[0] ?? "";
    return !name.includes("trust_device") &&
      (!freshLogin || !name.startsWith("mirror_identity."));
  });
  headers.set("cookie", cookies.join(";"));
  return headers;
}

/** A six-digit TOTP is too small to protect with an unkeyed digest. This is
 * replay bookkeeping AFTER the maintained library verifies a ceremony, not an OTP verifier. */
export function verifiedTotpDigest(secret: string, userId: string, code: string): string {
  if (secret.length < 32 || !userId || !/^\d{6}$/.test(code)) throw new PolicyError("invalid_totp_evidence", 400);
  return createHmac("sha256", secret).update(JSON.stringify(["mirror-totp-replay-v1", userId, code])).digest("hex");
}

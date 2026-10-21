import type { Config } from "./config.js";
import { platformOrigin } from "./config.js";

export const PRINCIPAL_REVOKED_PATH = "/api/internal/identity/principal-revoked";

/**
 * Best-effort notice to the platform that an Identity principal was revoked, so Prospect can close its own
 * principal, membership and access records without waiting for a session-status check. Uses the same
 * service bearer secret and outbound options as the other platform calls. Never throws: the revoke has
 * already committed and its outcome must not depend on the platform. Logs one JSON line without PII.
 * Contract: POST {"principalId": "<id>", "reason": "identity_revoked"}; 200, 202 and 404 mean done.
 */
export async function notifyPlatformPrincipalRevoked(config: Pick<Config, "platformOrigin" | "sessionStatusSecret">,
  principalId: string, fetchImpl: typeof fetch = fetch): Promise<number | "unconfigured" | "failed"> {
  let status: number | "unconfigured" | "failed";
  if (!config.sessionStatusSecret || config.sessionStatusSecret.length < 48) status = "unconfigured";
  else {
    try {
      const response = await fetchImpl(`${platformOrigin(config)}${PRINCIPAL_REVOKED_PATH}`, {
        method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5_000),
        headers: { authorization: `Bearer ${config.sessionStatusSecret}`, "content-type": "application/json" },
        body: JSON.stringify({ principalId, reason: "identity_revoked" }),
      });
      status = response.status;
      await response.body?.cancel().catch(() => undefined);
    } catch { status = "failed"; }
  }
  const done = status === 200 || status === 202 || status === 404;
  (done ? console.info : console.error)(JSON.stringify({ event: "identity_platform_revoke_notify", status }));
  return status;
}

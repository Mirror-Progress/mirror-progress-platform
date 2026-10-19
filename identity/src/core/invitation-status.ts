/**
 * Status label for a row of the admin Invitations list. Precedence: Revoked > Accepted > pending states.
 * A revoked account was usually accepted first, so "accepted" alone must never hide a revocation.
 */
export type InvitationRow = { source?: unknown; accepted?: unknown; revokedAt?: unknown; expiresAt?: unknown; deliveryStatus?: unknown };
export type InvitationStatus = "Revoked" | "Accepted" | "Pending · previous system" | "Expired" | "Sent" | "Delivery failed" | "Sending";

export function invitationStatus(item: InvitationRow, now = Date.now()): InvitationStatus {
  if (item.source === "legacy_pilot") return "Pending · previous system";
  if (item.revokedAt) return "Revoked";
  if (item.accepted === true) return "Accepted";
  if (new Date(String(item.expiresAt)).getTime() <= now) return "Expired";
  return item.deliveryStatus === "sent" ? "Sent" : item.deliveryStatus === "failed" ? "Delivery failed" : "Sending";
}

/** Only a managed invitation that is neither revoked nor accepted can be resent. */
export function invitationResendable(item: InvitationRow & { principalId?: unknown }): boolean {
  return /^[a-f0-9-]{36}$/.test(String(item.principalId)) && !item.revokedAt && item.accepted !== true;
}

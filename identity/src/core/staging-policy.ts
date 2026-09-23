import { assertSessionEvidence, PolicyError, MFA_MAX_AGE_MS, STEP_UP_MAX_AGE_MS } from "./policy.js";
import type { Principal, Evidence, LiveSession } from "./policy.js";
export function decimalEpoch(value: unknown): string {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,18})$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new PolicyError("invalid_epoch", 400);
  }
  return value; // Never Number(), parseInt(), or a JSON number.
}
export interface EnrollmentProof {
  principalId: string; userId: string; email: string; verifiedEmail: string;
  emailVerified: boolean; mailboxAt: number; issuer: string; reconciler: string;
}
export interface OperatorApproval {
  principalId: string; userId: string; epoch: string; email: string;
  approver: string; approvedAt: number; expiresAt: number;
}
export function assertStagingAuthorized(principal: Principal, live: LiveSession, evidence: Evidence | null,
  proof: EnrollmentProof | null, approval: OperatorApproval | null, now: number, maxAge = MFA_MAX_AGE_MS): Evidence {
  if (principal.disabled) throw new PolicyError("principal_disabled");
  decimalEpoch(principal.epoch);
  if (!proof || proof.principalId !== principal.id || proof.userId !== live.userId || !proof.emailVerified ||
      !proof.issuer || !proof.reconciler || !proof.email || proof.email !== proof.verifiedEmail || !Number.isFinite(proof.mailboxAt) || proof.mailboxAt > now) {
    throw new PolicyError("mailbox_evidence_required", 401);
  }
  if (principal.privileged) {
    if (!approval || approval.principalId !== principal.id || approval.userId !== live.userId ||
        approval.epoch !== principal.epoch || approval.email !== proof.email || !approval.approver ||
        [principal.id, proof.issuer, proof.reconciler].includes(approval.approver) ||
        !Number.isFinite(approval.approvedAt) || approval.approvedAt > now ||
        !Number.isFinite(approval.expiresAt) || approval.expiresAt <= now) {
      throw new PolicyError("independent_operator_approval_required");
    }
    if (evidence?.factor !== "passkey_uv" || evidence.mfaAt === null || evidence.mfaAt <= approval.approvedAt) {
      throw new PolicyError("fresh_passkey_after_approval_required", 401);
    }
    maxAge = Math.min(maxAge, STEP_UP_MAX_AGE_MS);
  }
  return assertSessionEvidence(principal, live, evidence, now, maxAge);
}
export function enrollmentMessage(code: unknown): string {
  const messages: Record<string, string> = {
    invalid_invitation: "This invitation is invalid, expired, or already used. Ask your operator for a new invitation.",
    mailbox_proof_required: "Use the current mailbox token delivered for this invitation. No account has been created.",
    enrollment_conflict: "This identity or email already has an account. Nothing was linked or replaced. Contact your operator.",
    mailbox_evidence_required: "Verified enrollment evidence is missing. Contact your operator; email login alone cannot restore access.",
    independent_operator_approval_required: "Your passkey can be registered, but privileged access is waiting for independent operator approval.",
    fresh_passkey_after_approval_required: "Operator approval requires a new passkey authentication. Registering a passkey is not authentication.",
    privileged_passkey_required: "Privileged identities must register and authenticate with a passkey. TOTP cannot grant privileged access.",
    principal_disabled: "This identity is disabled. Contact your operator. Enrollment cannot enable it.",
    mfa_required: "Complete a fresh password and TOTP login, or authenticate with your passkey.",
    mfa_expired: "Your authentication is no longer fresh. Sign in again with your required factors.",
    rate_limited: "Too many attempts. Pause before retrying; do not request additional mailbox messages.",
  };
  return typeof code === "string" && messages[code] ? messages[code]! : "The request could not be completed. Restart sign-in or contact your operator.";
}

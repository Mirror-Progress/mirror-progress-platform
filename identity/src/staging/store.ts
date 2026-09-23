import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { Store } from "../db.js";
import type { Config } from "../core/config.js";
import { PolicyError } from "../core/policy.js";
import type { Evidence, Principal } from "../core/policy.js";
import { assertStagingAuthorized } from "../core/staging-policy.js";
import { digest, opaqueToken, tokenDigest } from "../core/tokens.js";
import { openDelivery, sealDelivery } from "../core/delivery.js";
import type { EnrollmentTransport } from "../core/delivery.js";
const time = (v: unknown): number => v === null || v === undefined ? NaN : new Date(v as string | Date).getTime();
export class StagingStore extends Store {
  constructor(pool: Pool, readonly config: Config) {
    super(pool);
    if ((config.mode !== "staging" && config.mode !== "production") || !config.staging) throw new Error("Staging configuration required");
  }
  override assertCredentialPrincipal(p: Principal): void {
    // Credential setup is NOT application authorization, including for privileged users.
    if (p.disabled) throw new PolicyError("principal_disabled");
  }
  override async enroll(): Promise<never> { throw new PolicyError("mailbox_proof_required", 401); }
  override async sessionActive(sessionId: string, userId: string, principalId: string, epoch: string, requirePrivileged = false): Promise<boolean> {
    const { rows } = await this.pool.query(`SELECT EXISTS (
      SELECT 1 FROM "session" s JOIN mirror_binding b ON b.user_id=s."userId"
      JOIN "user" u ON u.id=s."userId" JOIN mirror_principal p ON p.id=b.principal_id
      JOIN mirror_assurance a ON a.session_id=s.id
      JOIN mirror_staging_enrollment e ON e.user_id=u.id AND e.principal_id=p.id AND e.email=u.email
      JOIN mirror_staging_invitation i ON i.digest=e.invitation_digest AND i.consumed_at IS NOT NULL
      JOIN mirror_staging_mailbox m ON m.id=e.mailbox_id AND m.invitation_digest=i.digest AND m.consumed_at IS NOT NULL
      JOIN mirror_staging_delivery d ON d.id=m.id AND d.accepted_at IS NOT NULL
      JOIN mirror_staging_reconciliation r ON r.principal_id=i.principal_id AND r.epoch=i.epoch AND r.email=i.email
      WHERE s.id=$1 AND s."userId"=$2 AND p.id=$3 AND p.authorization_epoch::text=$4
      AND (NOT $5::boolean OR p.privileged)
      AND NOT p.disabled AND u."emailVerified" AND s."expiresAt">clock_timestamp()
      AND s."createdAt">clock_timestamp()-interval '8 hours'
      AND a.user_id=u.id AND a.principal_id=p.id AND a.epoch=p.authorization_epoch
      AND a.factor IN ('passkey_uv','password_totp') AND a.mfa_at<=clock_timestamp()
      AND (NOT p.privileged OR (a.factor='passkey_uv' AND ($6::boolean OR EXISTS (
        SELECT 1 FROM mirror_staging_approval o WHERE o.principal_id=p.id AND o.user_id=u.id
        AND o.email=u.email AND o.epoch=p.authorization_epoch AND o.approver NOT IN (p.id,i.issuer,r.reconciler)
        AND o.approved_at<a.mfa_at AND o.expires_at>clock_timestamp()
        AND o.approved_at=(SELECT max(newest.approved_at) FROM mirror_staging_approval newest
          WHERE newest.principal_id=p.id AND newest.user_id=u.id AND newest.epoch=p.authorization_epoch)
      ))))
    ) AS active`, [sessionId, userId, principalId, epoch, requirePrivileged, this.config.mode === "production" && this.config.freshInstall === true]);
    return rows[0]?.active === true;
  }
  override async authorize(sessionId: string, expectedUserId?: string, maxAge?: number) {
    // One database snapshot for binding, epoch, mailbox evidence, approval, and assurance.
    const { rows } = await this.pool.query(`SELECT s."userId" AS user_id,s."expiresAt" AS session_expires,
      p.id,p.disabled,p.privileged,p.authorization_epoch::text AS epoch,
      a.user_id AS evidence_user,a.principal_id AS evidence_principal,a.epoch::text AS evidence_epoch,
      a.password_at,a.mfa_at,a.factor,a.expires_at,
      e.user_id AS proof_user,e.principal_id AS proof_principal,e.email AS verified_email,e.verified_at,
      u.email,u."emailVerified" AS email_verified,i.issuer,r.reconciler,
      (m.consumed_at IS NOT NULL AND i.consumed_at IS NOT NULL AND d.accepted_at IS NOT NULL) AS possession,
      o.principal_id AS approval_principal,o.user_id AS approval_user,o.epoch::text AS approval_epoch,
      o.email AS approval_email,o.approver,o.approved_at,o.expires_at AS approval_expires
      FROM "session" s JOIN "user" u ON u.id=s."userId"
      JOIN mirror_binding b ON b.user_id=u.id JOIN mirror_principal p ON p.id=b.principal_id
      LEFT JOIN mirror_assurance a ON a.session_id=s.id
      LEFT JOIN mirror_staging_enrollment e ON e.user_id=u.id AND e.principal_id=p.id
      LEFT JOIN mirror_staging_invitation i ON i.digest=e.invitation_digest AND i.principal_id=e.principal_id
        AND i.epoch=e.epoch AND i.email=e.email
      LEFT JOIN mirror_staging_reconciliation r ON r.principal_id=i.principal_id AND r.epoch=i.epoch AND r.email=i.email
      LEFT JOIN mirror_staging_mailbox m ON m.id=e.mailbox_id AND m.invitation_digest=i.digest
      LEFT JOIN mirror_staging_delivery d ON d.id=m.id
      LEFT JOIN LATERAL (SELECT * FROM mirror_staging_approval o WHERE o.principal_id=p.id
        AND o.user_id=u.id AND o.epoch=p.authorization_epoch ORDER BY o.approved_at DESC LIMIT 1) o ON true
      WHERE s.id=$1`, [sessionId]);
    const r = rows[0];
    if (!r || (expectedUserId !== undefined && r.user_id !== expectedUserId)) throw new PolicyError("session_required", 401);
    const principal: Principal = { id: r.id, disabled: r.disabled, privileged: r.privileged, epoch: r.epoch };
    const evidence: Evidence | null = r.evidence_epoch === null ? null : {
      sessionId, userId: r.evidence_user, principalId: r.evidence_principal, epoch: r.evidence_epoch,
      passwordAt: r.password_at === null ? null : time(r.password_at), mfaAt: r.mfa_at === null ? null : time(r.mfa_at),
      factor: r.factor, expiresAt: time(r.expires_at),
    };
    const verified = assertStagingAuthorized(principal,
      { id: sessionId, userId: r.user_id, expiresAt: time(r.session_expires) }, evidence,
      r.proof_user === null ? null : { principalId: r.proof_principal, userId: r.proof_user,
        email: r.email, verifiedEmail: r.verified_email, emailVerified: r.email_verified === true && r.possession === true,
        mailboxAt: time(r.verified_at), issuer: r.issuer, reconciler: r.reconciler },
      r.approver === null ? null : { principalId: r.approval_principal, userId: r.approval_user,
        epoch: r.approval_epoch, email: r.approval_email, approver: r.approver,
        approvedAt: time(r.approved_at), expiresAt: time(r.approval_expires) }, Date.now(), maxAge, !(this.config.mode === "production" && this.config.freshInstall === true));
    return { principal, evidence: verified };
  }
  private async invitation(db: PoolClient, hash: string) {
    const found = await db.query<{ principal_id: string }>("SELECT principal_id FROM mirror_staging_invitation WHERE digest=$1", [hash]);
    if (!found.rows[0]) throw new PolicyError("invalid_invitation", 400);
    // Same lock order in request and consume. Epoch/disable updates wait for this transaction.
    const locked = await db.query<Principal>("SELECT * FROM mirror_lock_principal($1)", [found.rows[0].principal_id]);
    const { rows } = await db.query(`SELECT i.*,i.epoch::text AS invitation_epoch FROM mirror_staging_invitation i
      WHERE digest=$1 FOR UPDATE`, [hash]);
    const clock = await db.query<{ at: Date }>("SELECT clock_timestamp() AS at");
    const i = rows[0], p = locked.rows[0], at = clock.rows[0]!.at;
    if (!i || !p || p.disabled || p.epoch !== i.invitation_epoch || i.consumed_at || time(i.expires_at) <= time(at)) {
      throw new PolicyError("invalid_invitation", 400);
    }
    return { ...i, at };
  }
  async requestMailbox(rawInvitation: unknown): Promise<void> {
    const hash = tokenDigest(rawInvitation);
    await this.transaction(async db => {
      const i = await this.invitation(db, hash);
      // Retries neither send again nor replace a pending mailbox token.
      const prior = await db.query("SELECT id FROM mirror_staging_mailbox WHERE invitation_digest=$1", [hash]);
      if (prior.rows.length) return;
      const id = randomUUID(), token = opaqueToken();
      await db.query(`INSERT INTO mirror_staging_mailbox(id,invitation_digest,token_digest,created_at,expires_at)
        VALUES ($1,$2,$3,$4,LEAST($5::timestamptz,$4::timestamptz+interval '10 minutes'))`,
        [id, hash, digest(token), i.at, i.expires_at]);
      await db.query("INSERT INTO mirror_staging_delivery(id,sealed_payload) VALUES ($1,$2)",
        [id, sealDelivery(this.config.staging!.deliveryKey, id, token)]);
    });
  }
  async enrollWithMailbox(rawInvitation: unknown, rawMailbox: unknown, name: string, passwordHash: string) {
    const invitationHash = tokenDigest(rawInvitation), mailboxHash = tokenDigest(rawMailbox);
    try {
      return await this.transaction(async db => {
        const i = await this.invitation(db, invitationHash);
        const { rows } = await db.query(`SELECT m.id FROM mirror_staging_mailbox m
          JOIN mirror_staging_delivery d ON d.id=m.id WHERE m.invitation_digest=$1 AND m.token_digest=$2
          AND m.consumed_at IS NULL AND m.expires_at>clock_timestamp() AND d.accepted_at IS NOT NULL FOR UPDATE OF m`,
          [invitationHash, mailboxHash]);
        if (!rows[0]) throw new PolicyError("mailbox_proof_required", 401);
        const used = await db.query(`UPDATE mirror_staging_mailbox SET consumed_at=clock_timestamp()
          WHERE id=$1 AND consumed_at IS NULL AND expires_at>clock_timestamp() RETURNING consumed_at`, [rows[0].id]);
        const consumed = await db.query(`UPDATE mirror_staging_invitation SET consumed_at=clock_timestamp()
          WHERE digest=$1 AND consumed_at IS NULL AND expires_at>clock_timestamp() RETURNING digest`, [invitationHash]);
        if (!used.rowCount || !consumed.rowCount) throw new PolicyError("invalid_invitation", 400);
        // Fresh accounts reserve their new subject with their new principal at bootstrap; no legacy linking.
        const userId = this.config.mode === "production" && this.config.freshInstall ? i.principal_id : randomUUID();
        // No find-by-email, update-existing-user, signup, auto-link, or session creation.
        await db.query(`INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt","twoFactorEnabled")
          VALUES ($1,$2,$3,true,now(),now(),false)`, [userId, name, i.email]);
        await db.query(`INSERT INTO "account" (id,"accountId","providerId","userId",password,"createdAt","updatedAt")
          VALUES ($1,$2,'credential',$2,$3,now(),now())`, [randomUUID(), userId, passwordHash]);
        await db.query("INSERT INTO mirror_binding(user_id,principal_id) VALUES ($1,$2)", [userId, i.principal_id]);
        await db.query(`INSERT INTO mirror_staging_enrollment
          (user_id,principal_id,epoch,email,invitation_digest,mailbox_id,verified_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [userId, i.principal_id, i.invitation_epoch, i.email, invitationHash, rows[0].id, used.rows[0].consumed_at]);
        return { userId, email: i.email };
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        throw new PolicyError("enrollment_conflict", 409);
      }
      throw error;
    }
  }
  /** Durable mailbox outbox. Production fresh-install delivery requires explicit SES configuration. */
  async dispatchOne(transport: EnrollmentTransport): Promise<"idle" | "sent" | "retry" | "failed"> {
    const item = await this.transaction(async db => {
      await db.query(`UPDATE mirror_staging_delivery d SET status='cancelled',sealed_payload=NULL,lease_until=NULL
        FROM mirror_staging_mailbox m JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
        JOIN mirror_principal p ON p.id=i.principal_id WHERE d.id=m.id AND d.status IN ('queued','sending')
        AND (m.expires_at<=clock_timestamp() OR i.expires_at<=clock_timestamp() OR i.consumed_at IS NOT NULL
          OR p.disabled OR p.authorization_epoch<>i.epoch)`);
      await db.query(`UPDATE mirror_staging_delivery SET status='failed',sealed_payload=NULL,lease_until=NULL
        WHERE status='sending' AND lease_until<=clock_timestamp() AND attempts>=5`);
      const { rows } = await db.query(`SELECT d.id,d.sealed_payload,d.attempts,i.email,m.expires_at
        FROM mirror_staging_delivery d JOIN mirror_staging_mailbox m ON m.id=d.id
        JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
        WHERE d.attempts<5 AND (d.status='queued' OR (d.status='sending' AND d.lease_until<=clock_timestamp()))
        ORDER BY m.created_at FOR UPDATE OF d SKIP LOCKED LIMIT 1`);
      if (!rows[0]) return null;
      await db.query(`UPDATE mirror_staging_delivery SET status='sending',attempts=attempts+1,
        lease_until=clock_timestamp()+interval '30 seconds' WHERE id=$1`, [rows[0].id]);
      return { ...rows[0], attempt: rows[0].attempts + 1 };
    });
    if (!item) return "idle";
    try {
      const token = openDelivery(this.config.staging!.deliveryKey, item.id, item.sealed_payload);
      await transport.send({ idempotencyKey: item.id, to: item.email,
        url: `${this.config.origin}/#mailboxToken=${encodeURIComponent(token)}`, expiresAt: item.expires_at });
      await this.pool.query(`UPDATE mirror_staging_delivery SET status='sent',accepted_at=clock_timestamp(),
        sealed_payload=NULL,lease_until=NULL,last_error=NULL WHERE id=$1 AND status='sending' AND attempts=$2`, [item.id, item.attempt]);
      return "sent";
    } catch {
      // Never persist or expose provider exceptions, URLs, email contents or bearer material.
      await this.pool.query(`UPDATE mirror_staging_delivery SET status=CASE WHEN attempts>=5 THEN 'failed' ELSE 'queued' END,
        sealed_payload=CASE WHEN attempts>=5 THEN NULL ELSE sealed_payload END,lease_until=NULL,last_error='transport_failed'
        WHERE id=$1 AND status='sending' AND attempts=$2`, [item.id, item.attempt]);
      return item.attempt >= 5 ? "failed" : "retry";
    }
  }
}

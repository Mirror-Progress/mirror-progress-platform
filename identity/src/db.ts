import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import type { Config } from "./core/config.js";
import { assertAuthorized, assertOrdinaryPrincipal, PolicyError, MFA_MAX_AGE_MS } from "./core/policy.js";
import type { Evidence, Factor, Principal } from "./core/policy.js";
import { digest, opaqueToken, tokenDigest } from "./core/tokens.js";

export interface SessionIdentity { session: { id: string; userId: string; expiresAt: Date; createdAt: Date }; user: { id: string } }
export function createPool(config: Config): Pool {
  return new Pool({ connectionString: config.databaseUrl, max: 10,
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 10000,
    ssl: (config.mode === "staging" || config.mode === "production") ? { rejectUnauthorized: true } : undefined,
    application_name: config.mode ? `mirror-identity-${config.mode}` : "mirror-identity-synthetic" });
}
const millis = (value: unknown): number => new Date(value as string | Date).getTime();
export class Store {
  constructor(readonly pool: Pool) {}
  assertCredentialPrincipal(principal: Principal): void { assertOrdinaryPrincipal(principal); }
  /** Server-to-server revocation check. Does not upgrade assurance or create a session. */
  async sessionActive(sessionId: string, userId: string, principalId: string, epoch: string, requirePrivileged = false): Promise<boolean> {
    if (requirePrivileged) return false; // Synthetic foundation has no privileged enrollment.
    const { rows } = await this.pool.query(`SELECT EXISTS (
      SELECT 1 FROM "session" s JOIN mirror_binding b ON b.user_id=s."userId"
      JOIN mirror_principal p ON p.id=b.principal_id JOIN mirror_assurance a ON a.session_id=s.id
      WHERE s.id=$1 AND s."userId"=$2 AND p.id=$3 AND p.authorization_epoch::text=$4
      AND NOT p.disabled AND NOT p.privileged AND s."expiresAt">clock_timestamp()
      AND s."createdAt">clock_timestamp()-interval '8 hours'
      AND a.user_id=s."userId" AND a.principal_id=p.id AND a.epoch=p.authorization_epoch
      AND a.factor IN ('passkey_uv','password_totp') AND a.mfa_at<=clock_timestamp()
    ) AS active`, [sessionId, userId, principalId, epoch]);
    return rows[0]?.active === true;
  }
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const db = await this.pool.connect();
    try { await db.query("BEGIN"); const result = await fn(db); await db.query("COMMIT"); return result; }
    catch (error) { await db.query("ROLLBACK"); throw error; }
    finally { db.release(); }
  }
  async principal(userId: string, db: Pool | PoolClient = this.pool): Promise<Principal> {
    const { rows } = await db.query<{ id: string; disabled: boolean; privileged: boolean; epoch: string }>(`
      SELECT p.id, p.disabled, p.privileged, p.authorization_epoch::text AS epoch
      FROM mirror_binding b JOIN mirror_principal p ON p.id = b.principal_id WHERE b.user_id = $1`, [userId]);
    if (!rows[0]) throw new PolicyError("principal_binding_missing", 401);
    return rows[0];
  }
  async authorize(sessionId: string, expectedUserId?: string, maxAge?: number): Promise<{ principal: Principal; evidence: Evidence }> {
    const { rows } = await this.pool.query(`
      SELECT s.id, s."userId" AS user_id, s."expiresAt" AS session_expires,
        p.id AS principal_id, p.disabled, p.privileged, p.authorization_epoch::text AS current_epoch,
        a.epoch::text AS evidence_epoch, a.password_at, a.mfa_at, a.factor, a.expires_at,
        a.user_id AS evidence_user, a.principal_id AS evidence_principal
      FROM "session" s JOIN mirror_binding b ON b.user_id = s."userId"
      JOIN mirror_principal p ON p.id = b.principal_id
      LEFT JOIN mirror_assurance a ON a.session_id = s.id WHERE s.id = $1`, [sessionId]);
    const r = rows[0];
    if (!r || (expectedUserId && r.user_id !== expectedUserId)) throw new PolicyError("session_required", 401);
    const principal: Principal = { id: r.principal_id, disabled: r.disabled, privileged: r.privileged, epoch: r.current_epoch };
    const evidence: Evidence | null = r.evidence_epoch === null ? null : {
      sessionId, userId: r.evidence_user, principalId: r.evidence_principal, epoch: r.evidence_epoch,
      passwordAt: r.password_at === null ? null : millis(r.password_at),
      mfaAt: r.mfa_at === null ? null : millis(r.mfa_at), factor: r.factor,
      expiresAt: millis(r.expires_at),
    };
    return { principal, evidence: assertAuthorized(principal,
      { id: sessionId, userId: r.user_id, expiresAt: millis(r.session_expires) }, evidence, Date.now(), maxAge) };
  }
  async recordEvidence(identity: SessionIdentity, factor: Factor | null, passwordAt: number | null, mfaAt: number | null, expectedEpoch?: string, totpDigest?: string): Promise<void> {
    await this.transaction(async (db) => {
      const principal = await this.principal(identity.user.id, db);
      const locked = await db.query<Principal>("SELECT * FROM mirror_lock_principal($1)", [principal.id]);
      const current = locked.rows[0];
      if (!current) throw new PolicyError("principal_binding_missing", 401);
      this.assertCredentialPrincipal(current);
      if (expectedEpoch !== undefined && current.epoch !== expectedEpoch) throw new PolicyError("authorization_epoch_changed", 401);
      if (factor === "password_totp") {
        if (expectedEpoch === undefined || !totpDigest) throw new PolicyError("totp_ceremony_binding_missing", 401);
        await this.reserveVerifiedTotp(identity.user.id, totpDigest, db);
      }
      const expiresAt = Math.min(millis(identity.session.expiresAt),
        millis(identity.session.createdAt) + 8 * 3600_000,
        (mfaAt ?? passwordAt ?? Date.now()) + (mfaAt === null ? 5 * 60_000 : MFA_MAX_AGE_MS));
      await db.query(`INSERT INTO mirror_assurance
        (session_id,user_id,principal_id,epoch,password_at,mfa_at,factor,expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (session_id) DO UPDATE SET epoch=EXCLUDED.epoch,
          password_at=EXCLUDED.password_at,mfa_at=EXCLUDED.mfa_at,factor=EXCLUDED.factor,expires_at=EXCLUDED.expires_at`,
        [identity.session.id, identity.user.id, current.id, current.epoch,
          passwordAt === null ? null : new Date(passwordAt), mfaAt === null ? null : new Date(mfaAt), factor, new Date(expiresAt)]);
    });
  }
  async freshEnrollmentSession(identity: SessionIdentity, maxPasswordAgeMs = 300_000): Promise<void> {
    this.assertCredentialPrincipal(await this.principal(identity.user.id));
    const { rows } = await this.pool.query(`SELECT a.password_at, a.expires_at, a.epoch::text,
      p.authorization_epoch::text AS current_epoch FROM mirror_assurance a
      JOIN mirror_principal p ON p.id=a.principal_id WHERE a.session_id=$1 AND a.user_id=$2`,
      [identity.session.id, identity.user.id]);
    const r = rows[0];
    if (!r || r.epoch !== r.current_epoch || !r.password_at || Date.now() - millis(r.password_at) >= maxPasswordAgeMs ||
        millis(r.password_at) > Date.now() || millis(r.expires_at) <= Date.now()) {
      throw new PolicyError("fresh_password_required", 401);
    }
  }
  async enroll(rawToken: unknown, name: string, passwordHash: string): Promise<{ userId: string; email: string }> {
    const hash = tokenDigest(rawToken);
    return this.transaction(async (db) => {
      const { rows } = await db.query(`SELECT i.*, p.disabled, p.privileged, p.authorization_epoch::text AS epoch
        FROM mirror_invitation i JOIN mirror_principal p ON p.id=i.principal_id
        WHERE i.digest=$1 AND i.consumed_at IS NULL AND i.expires_at > now()
        FOR UPDATE OF i`, [hash]);
      const invitation = rows[0];
      if (!invitation) throw new PolicyError("invalid_invitation", 400);
      const locked = await db.query<Principal>("SELECT * FROM mirror_lock_principal($1)", [invitation.principal_id]);
      if (!locked.rows[0]) throw new PolicyError("invalid_invitation", 400);
      assertOrdinaryPrincipal(locked.rows[0]);
      if (invitation.evidence_kind !== "synthetic-only") throw new PolicyError("unsupported_enrollment_evidence");
      const userId = randomUUID();
      // Email identifies a credential login, not a principal. Never search/merge an existing account.
      await db.query(`INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt","twoFactorEnabled")
        VALUES ($1,$2,$3,false,now(),now(),false)`, [userId, name, invitation.email]);
      await db.query(`INSERT INTO "account" (id,"accountId","providerId","userId",password,"createdAt","updatedAt")
        VALUES ($1,$2,'credential',$2,$3,now(),now())`, [randomUUID(), userId, passwordHash]);
      await db.query("INSERT INTO mirror_binding (user_id,principal_id) VALUES ($1,$2)", [userId, invitation.principal_id]);
      await db.query("UPDATE mirror_invitation SET consumed_at=now() WHERE digest=$1", [hash]);
      return { userId, email: invitation.email };
    });
  }
  async beginPasswordFlow(email: string, authCookie: string, at: number): Promise<string> {
    return this.transaction(async (db) => {
      // This lookup follows a successful library password verification. It does not link identities.
      const { rows } = await db.query<{ id: string }>('SELECT id FROM "user" WHERE email=$1', [email]);
      const user = rows[0];
      if (!user) throw new PolicyError("invalid_authentication", 401);
      const principal = await this.principal(user.id, db);
      const { rows: locked } = await db.query<Principal>("SELECT * FROM mirror_lock_principal($1)", [principal.id]);
      const current = locked[0];
      if (!current) throw new PolicyError("principal_binding_missing", 401);
      this.assertCredentialPrincipal(current);
      const token = opaqueToken();
      await db.query(`INSERT INTO mirror_password_flow(digest,user_id,epoch,auth_cookie_digest,password_at,expires_at)
        VALUES ($1,$2,$3,$4,$5,$6)`, [digest(token), user.id, current.epoch, digest(authCookie), new Date(at), new Date(at + 300_000)]);
      return token;
    });
  }
  async consumePasswordFlow(token: string | null, authCookie: string | null): Promise<{ userId: string; passwordAt: number; epoch: string }> {
    if (!token || !authCookie) throw new PolicyError("password_login_required", 401);
    const { rows } = await this.pool.query(`DELETE FROM mirror_password_flow
      WHERE digest=$1 AND auth_cookie_digest=$2 AND expires_at > now() RETURNING user_id,password_at,epoch::text`,
      [tokenDigest(token), digest(authCookie)]);
    if (!rows[0]) throw new PolicyError("password_login_required", 401);
    return { userId: rows[0].user_id, passwordAt: millis(rows[0].password_at), epoch: rows[0].epoch };
  }
  async reserveVerifiedTotp(userId: string, codeDigest: string, db: Pool | PoolClient = this.pool): Promise<void> {
    // A single winner across processes, sessions and overlapping password challenges.
    const { rows } = await db.query(`INSERT INTO mirror_totp_replay(user_id,digest,expires_at)
      VALUES ($1,$2,now()+interval '120 seconds') ON CONFLICT (user_id,digest) DO UPDATE
      SET expires_at=EXCLUDED.expires_at WHERE mirror_totp_replay.expires_at <= now() RETURNING user_id`, [userId, codeDigest]);
    if (!rows.length) throw new PolicyError("totp_replay_denied", 401);
  }
  async cancelPasswordFlow(token: string | null): Promise<void> {
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      await this.pool.query("DELETE FROM mirror_password_flow WHERE digest=$1", [digest(token)]);
    }
  }
  async revoke(userId: string, kind: "recovery" | "global_logout"): Promise<void> {
    await this.pool.query("SELECT mirror_revoke_subject($1,$2)", [userId, kind]);
  }
  async rateLimit(key: string, max = 30, windowMs = 60_000): Promise<void> {
    const start = Math.floor(Date.now() / windowMs) * windowMs;
    const { rows } = await this.pool.query<{ count: number }>(`INSERT INTO mirror_rate_limit(key,window_start,count)
      VALUES ($1,$2,1) ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN mirror_rate_limit.window_start < EXCLUDED.window_start THEN 1 ELSE mirror_rate_limit.count+1 END,
      window_start=GREATEST(mirror_rate_limit.window_start,EXCLUDED.window_start) RETURNING count`, [digest(key), start]);
    if ((rows[0]?.count ?? max + 1) > max) throw new PolicyError("rate_limited", 429);
  }
}

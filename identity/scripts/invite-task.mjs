import { productionContainerEnvironment } from './dist/src/core/container-config.js';
Object.assign(process.env, productionContainerEnvironment(process.env));
const { loadConfig } = await import('./dist/src/core/config.js');
const { createPool } = await import('./dist/src/db.js');
const { StagingStore } = await import('./dist/src/staging/store.js');
const { SesEnrollmentTransport, invitationRecipientDeliverable } = await import('./dist/src/core/ses-delivery.js');
const people = JSON.parse(Buffer.from(process.env.PROSPECT_INVITE_BATCH, 'base64url').toString());
const config = loadConfig();
if (config.mode !== 'production' || !config.freshInstall) throw new Error('wrong_environment');
const db = createPool(config), store = new StagingStore(db, config), transport = new SesEnrollmentTransport();
try {
  const { rows } = await db.query(`SELECT s.id,b.principal_id FROM "session" s JOIN "user" u ON u.id=s."userId"
    JOIN mirror_binding b ON b.user_id=u.id JOIN mirror_managed_invitation_admin ia ON ia.principal_id=b.principal_id
    JOIN mirror_assurance a ON a.session_id=s.id WHERE lower(u.email)='ronniemack@mirrorprogress.com'
    AND ia.active AND a.factor='passkey_uv' AND a.mfa_at>clock_timestamp()-interval '5 minutes'
    AND a.expires_at>clock_timestamp() AND s."expiresAt">clock_timestamp()
    ORDER BY a.mfa_at DESC LIMIT 1`);
  const sessionId = rows[0]?.id;
  if (!sessionId) throw new Error('OWNER_PASSKEY_REQUIRED');
  for (const person of people) {
    if (!await invitationRecipientDeliverable(person.email)) {
      console.log(JSON.stringify({ email: person.email, status: 'delivery_unavailable' }));
      continue;
    }
    if (person.accountType === 'external') {
      const check = await fetch('https://platform.mirrorprogress.com/api/internal/identity/company-check', {
        method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(3000),
        headers: { authorization: `Bearer ${config.sessionStatusSecret}`, 'content-type': 'application/json' },
        body: JSON.stringify({ company: person.company, email: person.email }),
      });
      if (!check.ok || (await check.json()).available !== true) {
        console.log(JSON.stringify({ email: person.email, status: 'company_unavailable' }));
        continue;
      }
    }
    const { rows: existing } = await db.query(`SELECT m.principal_id,m.account_type,m.requested_role,
      e.user_id IS NOT NULL AS accepted,d.status,i.expires_at
      FROM mirror_managed_invitation m LEFT JOIN mirror_staging_enrollment e ON e.principal_id=m.principal_id
      JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
      JOIN mirror_staging_mailbox b ON b.invitation_digest=i.digest
      JOIN mirror_staging_delivery d ON d.id=b.id
      WHERE lower(m.email)=$1 AND m.revoked_at IS NULL ORDER BY m.created_at DESC LIMIT 1`, [person.email]);
    if (existing[0]?.accepted) {
      console.log(JSON.stringify({ email: person.email, status: 'already_accepted' }));
      continue;
    }
    if (existing[0] && (existing[0].account_type !== person.accountType || existing[0].requested_role !== person.role)) {
      console.log(JSON.stringify({ email: person.email, status: 'existing_role_conflict' }));
      continue;
    }
    if (existing[0]?.status === 'sent' && new Date(existing[0].expires_at).getTime() > Date.now()) {
      console.log(JSON.stringify({ email: person.email, status: 'already_sent' }));
      continue;
    }
    if (existing[0]) await store.resendManagedInvitation(sessionId, existing[0].principal_id);
    else {
      await store.rateLimit(`managed-invite:${rows[0].principal_id}`, 10, 3_600_000);
      await store.issueManagedInvitation(sessionId, person);
    }
    console.log(JSON.stringify({ email: person.email, status: existing[0] ? 'resend_queued' : 'queued' }));
  }
  for (let n = 0; n < people.length + 3; n++) {
    const result = await store.dispatchOne(transport);
    if (result === 'idle') break;
  }
  const { rows: final } = await db.query(`SELECT DISTINCT ON (m.email) m.email,d.status,d.accepted_at FROM mirror_managed_invitation m
    JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
    JOIN mirror_staging_mailbox b ON b.invitation_digest=i.digest
    JOIN mirror_staging_delivery d ON d.id=b.id
    WHERE lower(m.email)=ANY($1::text[]) ORDER BY m.email,m.created_at DESC`, [people.map(p => p.email)]);
  console.log('FINAL:' + JSON.stringify(final));
} finally { transport.close(); await db.end(); }

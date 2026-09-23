import { randomUUID } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';
import { opaqueToken } from '../src/core/tokens.js';
import { decimalEpoch } from '../src/core/staging-policy.js';
import { productionDatabase } from '../src/core/production-config.js';

// Two distinct authenticated human operator logins, with independently recorded review evidence.
// The requester owns the private credential handoff file; no password is logged or emailed.
async function main() {
  if (process.env.IDENTITY_MODE !== 'production') throw new Error('Production only');
  const url = process.env.IDENTITY_OPERATOR_DATABASE_URL ?? ''; productionDatabase(url, false);
  const [command, target, epochOrReview, review, output, extra] = process.argv.slice(2);
  if (extra || !target || target.length > 255 || !['request', 'approve'].includes(command ?? '')) throw new Error('Invalid recovery command');
  const reference = command === 'request' ? review : epochOrReview;
  if (!reference || reference.trim().length < 8 || reference.length > 200) throw new Error('Review reference required');
  if (command === 'request') { decimalEpoch(epochOrReview); if (!output) throw new Error('Private output file required'); }
  else if (review || output || !/^[a-f0-9-]{36}$/.test(target)) throw new Error('Invalid approval arguments');
  const db = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true }, max: 1 });
  const client = await db.connect(); let created: string | undefined;
  try {
    await client.query('BEGIN'); await client.query('SET LOCAL ROLE mirror_identity_production_operator');
    if (command === 'request') {
      const requestId = randomUUID(), password = opaqueToken(), hashed = await hashPassword(password);
      await client.query('SELECT mirror_staging_request_recovery($1,$2,$3,$4,$5)', [requestId, target, epochOrReview, hashed, reference]);
      await writeFile(output!, JSON.stringify({ requestId, recoveryPassword: password, approvalWindowSeconds: 900 }) + '\n', { flag: 'wx', mode: 0o600 });
      created = output;
    } else await client.query('SELECT mirror_staging_approve_recovery($1,$2)', [target, reference]);
    await client.query('COMMIT');
    console.info('Assisted production recovery action audited. No email sent; factor reenrollment is required.');
  } catch (error) {
    await client.query('ROLLBACK'); if (created) await unlink(created).catch(() => undefined); throw error;
  } finally { client.release(); await db.end(); }
}
try { await main(); } catch { console.error('Assisted recovery rejected. Inspect privately without logging credential material.'); process.exitCode = 1; }

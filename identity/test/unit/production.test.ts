import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../src/core/config.js';
import { PRODUCTION, productionDatabase } from '../../src/core/production-config.js';
import { STAGING, loadStagingConfig } from '../../src/core/staging-config.js';
import { productionContainerEnvironment, stagingContainerEnvironment } from '../../src/core/container-config.js';
import { createPool, Store } from '../../src/db.js';
import { StagingStore } from '../../src/staging/store.js';
import { createAuth, emailIdentityClaims } from '../../src/auth.js';
import { createApp } from '../../src/app.js';
import { productionGrants } from '../../src/staging/grants.js';
const env = { IDENTITY_MODE: 'production', IDENTITY_ORIGIN: PRODUCTION.origin, IDENTITY_RP_ID: PRODUCTION.rpId,
  IDENTITY_OIDC_CLIENT_ID: PRODUCTION.clientId, IDENTITY_REDIRECT_URIS: JSON.stringify([PRODUCTION.redirect]),
  DATABASE_URL: 'postgresql://mirror_identity_production_runtime:synthetic-password@localhost/mirror_identity_production',
  BETTER_AUTH_SECRET: 'a'.repeat(64), IDENTITY_SESSION_STATUS_SECRET: 'b'.repeat(64),
  IDENTITY_DELIVERY_KEY: Buffer.alloc(32, 3).toString('base64url'),
  IDENTITY_TLS_CERT_FILE: '/synthetic/cert.pem', IDENTITY_TLS_KEY_FILE: '/synthetic/key.pem' };
test('production selects verified host, distinct DB/role, mandatory online status and verified database TLS', async () => {
  const config = loadConfig(env); assert.equal(config.mode, 'production'); assert.equal(config.staging?.rpId, PRODUCTION.rpId);
  const pool = createPool(config); assert.deepEqual(pool.options.ssl, { rejectUnauthorized: true });
  assert.equal(pool.options.application_name, 'mirror-identity-production');
  const store = new StagingStore(pool, config); const auth = createAuth(config, store);
  assert.equal(auth.options.emailAndPassword?.requireEmailVerification, true);
  assert.equal(auth.options.advanced?.useSecureCookies, true);
  assert.throws(() => createApp(config, new Store(pool), auth), /Store policy/);
  const app = createApp(config, store, auth);
  const page = await app(new Request(PRODUCTION.origin), '127.0.0.1');
  assert.equal(page.status, 200); assert.match(await page.text(), /data-identity-mode="production"/);
  await pool.end();
});
for (const [name, value] of Object.entries({ IDENTITY_ORIGIN: STAGING.origin, IDENTITY_RP_ID: STAGING.rpId,
  IDENTITY_OIDC_CLIENT_ID: STAGING.clientId, IDENTITY_REDIRECT_URIS: JSON.stringify([STAGING.redirect]),
  DATABASE_URL: env.DATABASE_URL.replaceAll('production', 'staging'), IDENTITY_SESSION_STATUS_SECRET: undefined,
  IDENTITY_TLS_CERT_FILE: 'relative.pem', IDENTITY_DELIVERY_KEY: 'bad' })) {
  test(`production rejects cross-environment or missing ${name}`, () => assert.throws(() => loadConfig({ ...env, [name]: value })));
}
test('production database cannot use owner as runtime, staging database, URL options or a runtime operator', () => {
  for (const url of [env.DATABASE_URL.replace('_runtime', '_owner'), env.DATABASE_URL + '?sslmode=disable',
    env.DATABASE_URL.replace('/mirror_identity_production', '/mirror_identity_staging')]) assert.throws(() => productionDatabase(url, true));
  assert.throws(() => productionDatabase(env.DATABASE_URL, false));
  assert.throws(() => productionDatabase(env.DATABASE_URL.replace("mirror_identity_production_runtime", "mirror_identity_staging_operator"), false));
  assert.throws(() => productionDatabase(env.DATABASE_URL.replace("production_runtime", "production_%72untime"), false));
  assert.throws(() => loadStagingConfig(env));
  assert(!productionGrants.includes('mirror_identity_staging_runtime')); assert(!productionGrants.includes('mirror_identity_staging_operator'));
  assert(productionGrants.includes('mirror_staging_approve_recovery')); // Existing checksummed schema, unchanged policy.
});
const credentials = { username: PRODUCTION.runtimeRole, dbname: PRODUCTION.database, engine: 'postgres', port: 5432, password: 'c'.repeat(64) };
const container = { ...env, IDENTITY_TRANSPORT: 'alb', IDENTITY_BIND_HOST: '0.0.0.0',
  IDENTITY_ALB_SUBNET_CIDRS: '10.0.0.0/24,10.0.1.0/24', IDENTITY_DATABASE_HOST: 'synthetic.abc123.us-east-1.rds.amazonaws.com',
  IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify(credentials), IDENTITY_DELIVERY_SEED: 'd'.repeat(64) };
test('production container accepts only own trust bundle and strips injected raw credentials', () => {
  const result = productionContainerEnvironment(container); assert.equal(result.IDENTITY_RUNTIME_CREDENTIALS, undefined);
  assert.equal(result.IDENTITY_DELIVERY_SEED, undefined); assert.equal(new URL(result.DATABASE_URL!).pathname, '/mirror_identity_production');
  assert.throws(() => stagingContainerEnvironment(container));
  for (const delta of [{ IDENTITY_MODE: 'staging' }, { IDENTITY_OWNER_CREDENTIALS: '{}' },
    { IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify({ ...credentials, username: STAGING.runtimeRole }) },
    { IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify({ ...credentials, dbname: 'mirror_identity_staging' }) },
    { IDENTITY_ORIGIN: STAGING.origin }, { IDENTITY_SESSION_STATUS_SECRET: undefined }]) {
    assert.throws(() => productionContainerEnvironment({ ...container, ...delta }));
  }
});

test('ID-token email claims require email scope and never upgrade an unverified user', () => {
  assert.deepEqual(emailIdentityClaims({email:'synthetic@example.invalid',emailVerified:true},['openid']),{});
  assert.deepEqual(emailIdentityClaims({email:'synthetic@example.invalid',emailVerified:false},['openid','email']),{email:'synthetic@example.invalid',email_verified:false});
  assert.deepEqual(emailIdentityClaims({email:'synthetic@example.invalid',emailVerified:true},['openid','email']),{email:'synthetic@example.invalid',email_verified:true});
});

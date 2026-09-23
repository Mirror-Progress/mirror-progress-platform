// Entirely local: disposable PostgreSQL TLS database and synthetic secrets; no AWS SDK or CLI.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const suffix = randomBytes(4).toString('hex'), network = `identity-test-${suffix}`, database = `${network}-db`, service = `${network}-service`;
const directory = mkdtempSync(join(tmpdir(), 'identity-container-'));
const image = process.env.IDENTITY_TEST_IMAGE ?? 'mirror-identity:local-production-candidate';
const host = 'identity-local.synthetic.us-east-1.rds.amazonaws.com';
const run = (command, args, env) => execFileSync(command, args, { encoding: 'utf8', timeout: 120000,
  env: env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const credential = () => randomBytes(32).toString('hex');
const password = credential(), runtimePassword = credential();
const env = { ...process.env, POSTGRES_USER: 'mirror_identity_production_owner', POSTGRES_PASSWORD: password, POSTGRES_DB: 'mirror_identity_production',
  IDENTITY_MODE: 'production', IDENTITY_TRANSPORT: 'alb', IDENTITY_BIND_HOST: '0.0.0.0',
  IDENTITY_ORIGIN: 'https://accounts.mirrorprogress.com', IDENTITY_RP_ID: 'accounts.mirrorprogress.com',
  IDENTITY_OIDC_CLIENT_ID: 'mirror-production', IDENTITY_REDIRECT_URIS: '["https://platform.mirrorprogress.com/api/auth/callback"]',
  IDENTITY_ALB_SUBNET_CIDRS: '10.231.0.0/24,10.231.1.0/24', IDENTITY_DATABASE_HOST: host,
  IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify({ username: 'mirror_identity_production_runtime', password: runtimePassword, port: 5432, engine: 'postgres', dbname: 'mirror_identity_production' }),
  IDENTITY_OWNER_CREDENTIALS: JSON.stringify({ username: 'mirror_identity_production_owner', password, host, port: 5432, engine: 'postgres', dbname: 'mirror_identity_production' }),
  BETTER_AUTH_SECRET: credential(), IDENTITY_SESSION_STATUS_SECRET: credential(), IDENTITY_DELIVERY_SEED: credential(),
  NODE_EXTRA_CA_CERTS: '/synthetic-ca/server.crt',
};
const names = ['IDENTITY_MODE', 'IDENTITY_TRANSPORT', 'IDENTITY_BIND_HOST', 'IDENTITY_ORIGIN', 'IDENTITY_RP_ID', 'IDENTITY_OIDC_CLIENT_ID',
  'IDENTITY_REDIRECT_URIS', 'IDENTITY_ALB_SUBNET_CIDRS', 'IDENTITY_DATABASE_HOST', 'IDENTITY_RUNTIME_CREDENTIALS',
  'BETTER_AUTH_SECRET', 'IDENTITY_SESSION_STATUS_SECRET', 'IDENTITY_DELIVERY_SEED', 'NODE_EXTRA_CA_CERTS'];
const injected = list => list.flatMap(name => ['-e', name]);
const hardening = ['--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--mount', `type=bind,src=${directory}/server.crt,dst=/synthetic-ca/server.crt,readonly`];
try {
  run('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', `/CN=${host}`,
    '-addext', `subjectAltName=DNS:${host}`, '-keyout', join(directory, 'server.key'), '-out', join(directory, 'server.crt')]);
  chmodSync(join(directory, 'server.key'), 0o600);
  run('docker', ['network', 'create', '--internal', '--subnet', '10.231.0.0/24', network]);
  run('docker', ['run', '-d', '--rm', '--name', database, '--network', network, '--network-alias', host,
    '--mount', `type=bind,src=${directory},dst=/tls,readonly`, ...injected(['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB']),
    '--entrypoint', 'sh', 'postgres:17-alpine', '-c',
    'mkdir -p /tmp/tls && cp /tls/server.* /tmp/tls/ && chown -R postgres:postgres /tmp/tls && chmod 600 /tmp/tls/server.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/tmp/tls/server.crt -c ssl_key_file=/tmp/tls/server.key'], env);
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { run('docker', ['exec', database, 'pg_isready', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production']); ready = true; break; } catch { await wait(500); }
  }
  if (!ready) throw new Error('database_startup_failed');
  // Same built migration executable as ECS, twice to prove repeatability.
  for (let i = 0; i < 2; i++) {
    const result = run('docker', ['run', '--rm', '--network', network, ...hardening, ...injected([...names, 'IDENTITY_OWNER_CREDENTIALS']),
      image, 'node', 'dist/scripts/migrate-production-container.js'], env);
    if (!result.includes('Production candidate schema applied')) throw new Error('migration_did_not_complete');
  }
  // Synthetic-only restore evidence: preserve a disabled principal and an epoch above JS integer precision.
  const sql = query => run('docker', ['exec', database, 'psql', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production', '-v', 'ON_ERROR_STOP=1', '-Atc', query]);
  sql("INSERT INTO mirror_principal(id,disabled,privileged,authorization_epoch) VALUES ('synthetic-restore-principal',true,true,9007199254740993)");
  run('docker', ['exec', database, 'pg_dump', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production', '-f', '/tmp/synthetic-backup.sql']);
  run('docker', ['exec', database, 'createdb', '-U', 'mirror_identity_production_owner', 'mirror_identity_production_restore']);
  run('docker', ['exec', database, 'psql', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production_restore', '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/synthetic-backup.sql']);
  const restored = run('docker', ['exec', database, 'psql', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production_restore', '-Atc',
    "SELECT id||':'||disabled::text||':'||privileged::text||':'||authorization_epoch::text FROM mirror_principal WHERE id='synthetic-restore-principal'"]);
  if(restored !== 'synthetic-restore-principal:true:true:9007199254740993') throw new Error('restore_principal_parity_failed');
  const checksums = "SELECT string_agg(name||':'||checksum,',' ORDER BY name) FROM mirror_schema_migration";
  const restoredChecksums = run('docker', ['exec', database, 'psql', '-U', 'mirror_identity_production_owner', '-d', 'mirror_identity_production_restore', '-Atc', checksums]);
  if(restoredChecksums !== sql(checksums)) throw new Error('restore_migration_parity_failed');
  console.log('Synthetic database restore preserved principal ID, disabled/privileged flags, precise epoch and migration checksums');
  const runtimeEnv = { ...env }; delete runtimeEnv.POSTGRES_PASSWORD; delete runtimeEnv.POSTGRES_USER; delete runtimeEnv.POSTGRES_DB; delete runtimeEnv.IDENTITY_OWNER_CREDENTIALS;
  run('docker', ['run', '-d', '--rm', '--name', service, '--network', network, ...hardening,
    '--tmpfs', '/run/identity:rw,noexec,nosuid,uid=1000,gid=1000,mode=700,size=1m', ...injected(names), image, 'node', 'dist/scripts/start-production-container.js'], runtimeEnv);
  const probe = `const http=await import('node:http'),https=await import('node:https');
    async function get(path,port,headers={}) {return await new Promise((resolve,reject)=>{
      const req=(port===3040?https:http).request({hostname:${JSON.stringify(service)},port,path,headers,rejectUnauthorized:false},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));});req.on('error',reject);req.end();});}
    const headers={host:'accounts.mirrorprogress.com','x-forwarded-for':'forged, 192.0.2.10','x-forwarded-proto':'https','x-forwarded-port':'443'};
    const checks=[await get('/health/ready',3041),await get('/api/auth/sign-in',3041),await get('/',3040,headers),await get('/',3040,{...headers,host:'attacker.invalid'}),await get('/',3040,{...headers,'x-forwarded-proto':'http'})];
    if(JSON.stringify(checks)!=='[200,404,200,400,400]')process.exit(1); console.log('TLS database, repeated migrations, non-root read-only startup, ALB forwarding and health isolation passed');`;
  let passed = false;
  for (let i = 0; i < 20; i++) {
    try { console.log(run('docker', ['run', '--rm', '--network', network, '--read-only', '--cap-drop', 'ALL', image, 'node', '--input-type=module', '-e', probe])); passed = true; break; }
    catch { await wait(500); }
  }
  if (!passed) throw new Error('service_checks_failed');
  const direct = run('docker', ['exec', service, 'node', '-e', `require('https').get({hostname:'127.0.0.1',port:3040,headers:{host:'accounts.mirrorprogress.com'},rejectUnauthorized:false},r=>{r.resume();r.on('end',()=>process.exit(r.statusCode===400?0:1));}).on('error',()=>process.exit(1));`]);
  console.log('Direct non-ALB authentication request rejected');
  const privilegeProbe = `const {Pool}=require('pg');const c=JSON.parse(process.env.IDENTITY_RUNTIME_CREDENTIALS);const db=new Pool({host:process.env.IDENTITY_DATABASE_HOST,port:5432,user:c.username,password:c.password,database:c.dbname,ssl:{rejectUnauthorized:true}});(async()=>{const {rows}=await db.query("SELECT current_user AS role, has_schema_privilege(current_user,'public','CREATE') AS ddl, has_function_privilege(current_user,'mirror_staging_approve_recovery(text,text)','EXECUTE') AS approve");await db.end();if(rows[0].role!=='mirror_identity_production_runtime'||rows[0].ddl||rows[0].approve)process.exit(1);console.log('Production runtime role has no schema-create or recovery-approval privilege');})();`;
  console.log(run('docker', ['exec', service, 'node', '-e', privilegeProbe]));

} catch (error) {
  // exec errors contain the command and stderr; do not print potentially credential-bearing structures.
  console.error('Local production-profile container rehearsal failed. No AWS operations were performed.');
  process.exitCode = 1;
} finally {
  for (const name of [service, database]) { try { run('docker', ['rm', '-f', name]); } catch {} }
  try { run('docker', ['network', 'rm', network]); } catch {}
  rmSync(directory, { recursive: true, force: true });
}

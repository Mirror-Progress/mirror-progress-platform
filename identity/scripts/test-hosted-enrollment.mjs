// Local-only integration runner: both profiles, Chromium, actual app callback and real test databases.
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
if(Number(process.versions.node.split('.')[0])!==24)throw new Error('node24_required');
const inspect=JSON.parse(execFileSync('docker',['inspect','mp-identity-postgres-test'],{encoding:'utf8'}))[0];
const bindings=inspect.HostConfig.PortBindings['5432/tcp'];
if(bindings.length!==1||bindings[0].HostIp!=='127.0.0.1'||bindings[0].HostPort!=='55432')throw new Error('isolated_loopback_postgres_required');
const password=inspect.Config.Env.find(v=>v.startsWith('POSTGRES_PASSWORD='))?.slice('POSTGRES_PASSWORD='.length);
if(!password)throw new Error('local_test_password_required');
execFileSync(process.execPath,['docs/identity-migration/candidate/apply-overlay.mjs'],{cwd:root,stdio:'pipe'});
const env={...process.env,IDENTITY_BROWSER_TESTS:'1',IDENTITY_TEST_APP_ROOT:join(root,'identity-release/client')};
for(const key of Object.keys(env))if(key.startsWith('AWS_'))delete env[key];
env.AWS_EC2_METADATA_DISABLED='true';
for(const profile of ['staging','production']){
 const database=profile==='staging'?'mirror_identity_enrollment_test':'mirror_identity_production_enrollment_test';
 const exists=execFileSync('docker',['exec','mp-identity-postgres-test','psql','-U','postgres','-Atc',`SELECT 1 FROM pg_database WHERE datname='${database}'`],{encoding:'utf8'}).trim();
 if(exists!=='1')execFileSync('docker',['exec','mp-identity-postgres-test','createdb','-U','postgres',database]);
 const url=new URL(`postgresql://127.0.0.1:55432/${database}`);url.username='postgres';url.password=password;
 env.ENROLLMENT_TEST_DATABASE_URL=url.href;env.ENROLLMENT_TEST_PROFILE=profile;
 console.info(`Running ${profile} synthetic enrollment/browser checks`);
 const result=spawnSync(process.execPath,['--test','--test-concurrency=1','dist/test/staging/enrollment.test.js'],{cwd:join(root,'identity'),env,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status??1);
}

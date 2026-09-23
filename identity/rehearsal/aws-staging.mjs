// Explicit one-off AWS STAGING test, never a runtime endpoint or production enrollment worker.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash, createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { StagingStore } from '../dist/src/staging/store.js';
import { loadStagingConfig, STAGING } from '../dist/src/core/staging-config.js';
import { FakeEnrollmentTransport } from '../dist/src/core/delivery.js';
import { digest, responseCookies } from '../dist/src/core/tokens.js';
const SOURCE='mirroridentitystagingfoundation-databaseb269d8bb-j8eokj7whynd.cmrqsiq08tiq.us-east-1.rds.amazonaws.com';
const DOCDB='mirror-progress-security-staging-state.cluster-cmrqsiq08tiq.us-east-1.docdb.amazonaws.com';
const APP='https://staging.mirrorprogress.com', IDENTITY=STAGING.origin;
assert.equal(process.env.IDENTITY_REHEARSAL_CONFIRM,'synthetic-only-staging-8464ab6');
assert.equal(process.env.IDENTITY_MODE,'staging');
const ownerCredential=JSON.parse(process.env.IDENTITY_OWNER_CREDENTIALS??'null');
assert.equal(ownerCredential.host,SOURCE);assert.equal(ownerCredential.dbname,'mirror_identity_staging');assert.equal(ownerCredential.username,'mirror_identity_owner');
const database=(host,credential=ownerCredential)=>new Pool({host,port:5432,user:credential.username,password:credential.password,database:'mirror_identity_staging',ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:10000,statement_timeout:10000});
const owner=database(SOURCE);
let phase='configuration', mongo, operator, fixture, operatorRole;
const checksum=rows=>createHash('sha256').update(JSON.stringify(rows)).digest('hex');
async function restore(){
 const host=process.env.IDENTITY_RESTORE_HOST;
 assert.match(host??'',/^mirror-identity-staging-restore-20260923\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
 const restored=database(host);
 try{
  const query='SELECT name,checksum FROM mirror_schema_migration ORDER BY name';
  const source=(await owner.query(query)).rows,target=(await restored.query(query)).rows;
  assert.equal(source.length,3);assert.deepEqual(target,source);
  const client='SELECT "clientId","redirectUris","requirePKCE",disabled FROM "oauthClient" ORDER BY "clientId"';
  assert.deepEqual((await restored.query(client)).rows,(await owner.query(client)).rows);
  const roles=await restored.query("SELECT has_schema_privilege('mirror_identity_staging_runtime','public','CREATE') AS ddl,has_function_privilege('mirror_identity_staging_runtime','mirror_staging_approve_recovery(text,text)','EXECUTE') AS approval");
  assert.equal(roles.rows[0].ddl,false);assert.equal(roles.rows[0].approval,false);
  const ssl=(await restored.query('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()')).rows[0];assert.equal(ssl.ssl,true);
  console.info(JSON.stringify({check:'aws-rds-point-in-time-restore',passed:true,migrationCount:3,migrationDigest:checksum(source),clientParity:true,runtimePrivilegesPreserved:true,verifiedTls:true}));
 }finally{await restored.end();}
}
class Browser{
 constructor(origin){this.origin=origin;this.headers=new Headers({origin});}
 async request(path,body,overrideCookie){
  const url=new URL(path,this.origin);assert.equal(url.origin,this.origin);
  const headers=new Headers(this.headers);if(body===undefined)headers.set('sec-fetch-mode','navigate');if(overrideCookie!==undefined)headers.set('cookie',overrideCookie);
  if(body!==undefined)headers.set('content-type','application/json');
  // Node fetch overwrites Sec-Fetch-Mode from its mode option. Avoid its default cors
  // response negotiation so GET authorization follows the provider navigation branch.
  const r=await fetch(url,{mode:'same-origin',method:body===undefined?'GET':'POST',headers,redirect:'manual',signal:AbortSignal.timeout(15000),...(body===undefined?{}:{body:JSON.stringify(body)})});
  this.headers.set('cookie',responseCookies(this.headers,r.headers).get('cookie')??'');return r;
 }
}
function totp(uri){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of new URL(uri).searchParams.get('secret').replace(/=+$/,''))bits+=alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');
 const key=Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2))),counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const mac=createHmac('sha1',key).update(counter).digest(),offset=mac.at(-1)&15;return ((mac.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
async function callback(){
 phase='isolation';
 assert.equal((await owner.query("SELECT count(*) AS n FROM mirror_principal WHERE id NOT LIKE 'aws-rehearsal-%'")).rows[0].n,'0');
 assert.equal((await owner.query("SELECT count(*) AS n FROM \"user\" WHERE email NOT LIKE 'aws-rehearsal-%@example.invalid'")).rows[0].n,'0');
 const require=createRequire('/application/package.json'),{MongoClient}=require('mongodb');
 const uri=new URL(`mongodb://${DOCDB}:27017/mirror_identity_rehearsal`);uri.username=process.env.DOCDB_USERNAME;uri.password=process.env.DOCDB_PASSWORD;
 uri.searchParams.set('tls','true');uri.searchParams.set('replicaSet','rs0');uri.searchParams.set('readPreference','primary');uri.searchParams.set('retryWrites','false');uri.searchParams.set('authSource','admin');
 mongo=new MongoClient(uri.href,{tlsCAFile:'/app/certs/aws-rds-global-bundle.pem',serverSelectionTimeoutMS:15000});await mongo.connect();const db=mongo.db('mirror_identity_rehearsal');
 assert.equal(await db.collection('authorization_principals').countDocuments({principalId:{$not:/^aws-rehearsal-/}}),0);
 fixture='aws-rehearsal-'+randomUUID();const actor=fixture+'-operator',email=fixture+'@example.invalid',epoch='9007199254740993',password=randomBytes(32).toString('base64url');
 operatorRole='aws_rehearsal_op_'+randomBytes(8).toString('hex');const operatorPassword=randomBytes(32).toString('hex');
 phase='synthetic-fixture';
 await owner.query('INSERT INTO mirror_principal(id,authorization_epoch,privileged) VALUES ($1,$2,false),($3,0,false)',[fixture,epoch,actor]);
 const roleSql=(await owner.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',$1::text,$2::text) AS sql",[operatorRole,operatorPassword])).rows[0].sql;
 await owner.query(roleSql);await owner.query(`GRANT mirror_identity_staging_operator TO ${operatorRole}`);
 await owner.query('INSERT INTO mirror_staging_operator(login_role,principal_id) VALUES ($1,$2)',[operatorRole,actor]);
 operator=database(SOURCE,{username:operatorRole,password:operatorPassword});
 const invitation=randomBytes(32).toString('base64url'),client=await operator.connect();
 try{await client.query('BEGIN');await client.query('SET LOCAL ROLE mirror_identity_staging_operator');
  await client.query('SELECT mirror_staging_reconcile($1,$2::bigint,$3,$4)',[fixture,epoch,email,'SYNTHETIC AWS REHEARSAL - NOT HUMAN ENROLLMENT']);
  await client.query('SELECT mirror_staging_issue($1,$2::bigint,$3,$4)',[fixture,epoch,digest(invitation),'SYNTHETIC AWS REHEARSAL - FAKE MAIL ONLY']);await client.query('COMMIT');
 }finally{client.release();}
 const provider=new Browser(IDENTITY),application=new Browser(APP);
 phase='mailbox';
 assert.equal((await owner.query("SELECT count(*) AS n FROM mirror_staging_delivery WHERE status IN ('queued','sending')")).rows[0].n,'0');
 assert.equal((await provider.request('/api/identity/request-mailbox',{invitation})).status,202);
 // Test-only sink scoped to an otherwise empty staging outbox; it sends no email.
 const config=loadStagingConfig({...process.env,IDENTITY_TLS_CERT_FILE:'/unused/cert',IDENTITY_TLS_KEY_FILE:'/unused/key',
  DATABASE_URL:`postgresql://mirror_identity_staging_runtime:synthetic-unused@${SOURCE}/mirror_identity_staging`,
  IDENTITY_DELIVERY_KEY:createHash('sha256').update(process.env.IDENTITY_DELIVERY_SEED).digest('base64url')});
 const sink=new FakeEnrollmentTransport(),store=new StagingStore(owner,config);assert.equal(await store.dispatchOne(sink),'sent');assert.equal(sink.messages.size,1);
 const message=[...sink.messages.values()][0];assert.equal(message.to,email);const mailboxToken=new URLSearchParams(new URL(message.url).hash.slice(1)).get('mailboxToken');
 assert.equal((await provider.request('/api/identity/enroll',{invitation,mailboxToken,name:'Synthetic AWS rehearsal',password})).status,201);
 phase='real-password-totp';
 assert.equal((await provider.request('/api/auth/sign-in/email',{email,password})).status,200);
 const enabled=await provider.request('/api/auth/two-factor/enable',{password});assert.equal(enabled.status,200);const setup=await enabled.json();assert(setup.totpURI);
 assert.equal((await provider.request('/api/auth/two-factor/verify-totp',{code:totp(setup.totpURI)})).status,200);
 await provider.request('/api/auth/sign-out',{});
 assert.equal((await provider.request('/api/auth/sign-in/email',{email,password})).status,200);
 await new Promise(resolve=>setTimeout(resolve,30100-(Date.now()%30000)));
 assert.equal((await provider.request('/api/auth/two-factor/verify-totp',{code:totp(setup.totpURI)})).status,200);
 const verified=await(await provider.request('/api/identity/session')).json();assert.equal(verified.mfaCompleted,true);assert.equal(verified.principalId,fixture);
 phase='explicit-mapping';
 const user=(await owner.query('SELECT id FROM "user" WHERE email=$1',[email])).rows[0].id;
 const issuer=IDENTITY+'/api/auth',scope={tenantId:fixture,workspaceId:fixture},membershipId=randomUUID(),policyRevisionId=randomUUID();
 await db.collection('authorization_principals').insertOne({principalId:fixture,cognitoSubject:'synthetic-'+randomUUID(),...scope,status:'active',authorizationEpoch:7,email,displayName:'Synthetic AWS rehearsal'});
 await db.collection('authorization_memberships').insertOne({principalId:fixture,membershipId,...scope,status:'active',roles:['client']});
 await db.collection('authorization_policy_heads').insertOne({...scope,policyRevisionId,policyId:'synthetic-rehearsal'});
 await db.collection('authorization_identity_mappings').insertOne({_id:checksum([issuer,user]),issuer,subject:user,principalId:fixture,enabled:true,reviewRef:'SYNTHETIC AWS REHEARSAL ONLY'});
 phase='app-start';
 const start=await application.request('/api/auth/start?next=/workspace');assert.equal(start.status,302);
 phase='provider-authorize';
 const authorization=await provider.request(start.headers.get('location'));assert.equal(authorization.status,302);
 const redirect=new URL(authorization.headers.get('location'));assert.equal(redirect.origin,APP);const flowCookie=application.headers.get('cookie');
 phase='app-callback';
 const callback=await application.request(redirect.href);assert.equal(callback.status,302);assert.equal(callback.headers.get('location'),'/workspace');
 phase='app-session';
 const session=await(await application.request('/api/auth/session')).json();assert.equal(session.user?.id,fixture);assert.equal(session.user?.role,'client');
 phase='stored-session-parity';
 const saved=await db.collection('authorization_sessions').findOne({principalId:fixture});assert(saved);assert.equal(saved.authorizationEpoch,7);assert.equal(saved.identityBinding.epoch,epoch);assert.equal(saved.membershipId,membershipId);
 phase='callback-replay';
 const sessionCookie=application.headers.get('cookie');const replay=await application.request(redirect.href,undefined,flowCookie);assert.equal(replay.status,404);application.headers.set('cookie',sessionCookie);
 phase='disable-and-revoke';
 await db.collection('authorization_memberships').updateOne({membershipId},{$set:{status:'disabled'}});assert.equal((await(await application.request('/api/auth/session')).json()).user,null);
 await db.collection('authorization_memberships').updateOne({membershipId},{$set:{status:'active'}});
 assert.equal((await provider.request('/api/identity/global-logout',{})).status,200);assert.equal((await(await application.request('/api/auth/session')).json()).user,null);
 console.info(JSON.stringify({check:'aws-https-callback-parity',passed:true,fixture,principalPreserved:true,membershipPreserved:true,epochsPreserved:true,replayDenied:true,disabledMembershipDenied:true,revocationDenied:true,enrollment:'synthetic ordinary user, real password/TOTP, fake mail sink; not human enrollment'}));
}
try{if(process.env.IDENTITY_REHEARSAL_KIND==='restore')await restore();else{assert.equal(process.env.IDENTITY_REHEARSAL_KIND,'callback');await callback();}}
catch(error){console.error(JSON.stringify({check:'aws-staging-rehearsal',passed:false,phase,code:typeof error?.code==='string'&&/^[A-Z0-9_]{1,32}$/.test(error.code)?error.code:undefined,actualStatus:Number.isInteger(error?.actual)?error.actual:undefined,expectedStatus:Number.isInteger(error?.expected)?error.expected:undefined}));process.exitCode=1;}
finally{
 try{
  if(fixture){
   await owner.query('UPDATE mirror_principal SET disabled=true WHERE id=$1 OR id=$2',[fixture,fixture+'-operator']);
   await owner.query('UPDATE mirror_staging_operator SET active=false WHERE principal_id=$1',[fixture+'-operator']);
   const users=(await owner.query('SELECT user_id FROM mirror_binding WHERE principal_id=$1',[fixture])).rows;
   for(const user of users)await owner.query('SELECT mirror_revoke_subject($1,$2)',[user.user_id,'global_logout']);
   if(mongo){const db=mongo.db('mirror_identity_rehearsal');await db.collection('authorization_principals').updateMany({principalId:fixture},{$set:{status:'disabled'}});await db.collection('authorization_identity_mappings').updateMany({principalId:fixture},{$set:{enabled:false}});}
  }
  if(operator){await operator.end();operator=undefined;}
  if(operatorRole)await owner.query(`DROP ROLE IF EXISTS ${operatorRole}`);
  console.info(JSON.stringify({check:'rehearsal-cleanup',syntheticAccountsDisabled:!!fixture,operatorLoginRemoved:!!operatorRole}));
 }catch{console.error('Synthetic fixture cleanup needs attention');process.exitCode=1;}
 if(operator)await operator.end();if(mongo)await mongo.close();await owner.end();
}

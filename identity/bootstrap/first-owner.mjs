// Explicit one-time fresh-install bootstrap. No Cognito imports or old-account modifications.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {Pool} from 'pg';
const require=createRequire('/application/package.json'),{MongoClient}=require('mongodb');
assert.equal(process.env.IDENTITY_BOOTSTRAP_CONFIRM,'fresh-owner-authorized-20260923');
const setup=JSON.parse(process.env.IDENTITY_OWNER_SETUP??'null'),credential=JSON.parse(process.env.IDENTITY_OWNER_CREDENTIALS??'null');
assert.equal(credential.dbname,'mirror_identity_production');assert.equal(credential.username,'mirror_identity_production_owner');assert.match(credential.host,/^mirroridentityproductionfoundatio(?:n)?-[a-z0-9-]+\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
assert.match(setup.principalId,/^[a-f0-9-]{36}$/);assert.match(setup.membershipId,/^[a-f0-9-]{36}$/);assert.match(setup.invitation,/^[A-Za-z0-9_-]{43}$/);assert.match(setup.email,/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@mirrorprogress\.com$/);
const pg=new Pool({host:credential.host,user:credential.username,password:credential.password,database:credential.dbname,ssl:{rejectUnauthorized:true},max:1,connectionTimeoutMillis:10000});
const uri=new URL('mongodb://mirror-progress-state.cluster-cmrqsiq08tiq.us-east-1.docdb.amazonaws.com:27017/?tls=true&replicaSet=rs0&readPreference=primary&retryWrites=false&authSource=admin');uri.username=process.env.DOCDB_USERNAME;uri.password=process.env.DOCDB_PASSWORD;
const mongo=new MongoClient(uri.href,{tlsCAFile:'/app/certs/aws-rds-global-bundle.pem',serverSelectionTimeoutMS:15000});
const actor='fresh-install-bootstrap',scope={tenantId:'tenant:mirror-progress',workspaceId:'workspace:mirror-progress:internal'},issuer='https://accounts.mirrorprogress.com/api/auth';let phase='connect';
try {
 await mongo.connect();const db=mongo.db('mirror_progress');
 phase='empty-identity-check';assert.equal((await pg.query('SELECT count(*) AS n FROM "user"')).rows[0].n,'0');
 assert.equal((await pg.query('SELECT count(*) AS n FROM mirror_principal WHERE id NOT IN ($1,$2)',[setup.principalId,actor])).rows[0].n,'0');
 const head=await db.collection('authorization_policy_heads').findOne(scope);assert(head?.policyRevisionId);
 phase='fresh-principal';await pg.query('BEGIN');
 await pg.query('INSERT INTO mirror_principal(id,privileged,authorization_epoch) VALUES ($1,true,0),($2,false,0) ON CONFLICT(id) DO NOTHING',[setup.principalId,actor]);
 const principal=(await pg.query('SELECT privileged,disabled,authorization_epoch::text AS epoch FROM mirror_principal WHERE id=$1',[setup.principalId])).rows[0];assert.deepEqual(principal,{privileged:true,disabled:false,epoch:'0'});
 await pg.query('INSERT INTO mirror_staging_operator(login_role,principal_id) VALUES (session_user,$1) ON CONFLICT(login_role) DO NOTHING',[actor]);
 if(!(await pg.query('SELECT 1 FROM mirror_staging_reconciliation WHERE principal_id=$1',[setup.principalId])).rowCount)
  await pg.query('SELECT mirror_staging_reconcile($1,0,$2,$3)',[setup.principalId,setup.email,'User authorized fresh installation; new first owner, no account migration']);
 const reconciliation=(await pg.query('SELECT email FROM mirror_staging_reconciliation WHERE principal_id=$1 AND epoch=0',[setup.principalId])).rows[0];assert.equal(reconciliation.email,setup.email);
 const now=new Date().toISOString(),base={...scope,schemaVersion:'mirror-progress-state-kernel.v2',policyVersion:'mirror-progress-policy.v2',createdAt:now,updatedAt:now};
 const p={...base,principalId:setup.principalId,cognitoSubject:'mirror-fresh:'+setup.principalId,email:setup.email,displayName:'Owner',status:'active',authorizationEpoch:0};
 const m={...base,principalId:setup.principalId,membershipId:setup.membershipId,status:'active',roles:['super_admin']};
 const map={_id:createHash('sha256').update(JSON.stringify([issuer,setup.principalId])).digest('hex'),issuer,subject:setup.principalId,principalId:setup.principalId,enabled:true,reviewRef:'Fresh owner bootstrap explicitly authorized by owner; no legacy linking'};
 for(const [name,key,value] of [['authorization_principals',{principalId:setup.principalId},p],['authorization_memberships',{membershipId:setup.membershipId},m],['authorization_identity_mappings',{_id:map._id},map]]){
  const existing=await db.collection(name).findOne(key);
  if(existing){for(const field of Object.keys(value).filter(k=>!['createdAt','updatedAt'].includes(k)))assert.deepEqual(existing[field],value[field]);}
  else await db.collection(name).insertOne(value);
 }
 phase='setup-invitation';const hash=createHash('sha256').update(setup.invitation).digest('hex');
 await pg.query('SELECT mirror_staging_issue($1,0,$2,$3)',[setup.principalId,hash,'User-authorized fresh first-owner setup invitation']);
 await pg.query('COMMIT');console.info(JSON.stringify({check:'fresh-first-owner-bootstrap',passed:true,newOwner:1,legacyAccountsImported:0,mailSent:false,invitationExpiresInSeconds:900}));
}catch{await pg.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({check:'fresh-first-owner-bootstrap',passed:false,phase}));process.exitCode=1;}
finally{await mongo.close();await pg.end();}

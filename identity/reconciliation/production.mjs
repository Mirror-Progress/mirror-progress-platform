import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {CognitoIdentityProviderClient,paginateListUsers} from '@aws-sdk/client-cognito-identity-provider';
import {reconcile} from './parity.mjs';
assert.equal(process.env.IDENTITY_RECONCILE_CONFIRM,'read-only-canonical-20260923');
const host='mirror-progress-state.cluster-cmrqsiq08tiq.us-east-1.docdb.amazonaws.com',database='mirror_progress';
const role='mirror_identity_reconcile_20260923',user=role;
const names=['authorization_principals','authorization_memberships','authorization_policy_heads'];
const connect=(username,password)=>{const u=new URL(`mongodb://${host}:27017/?tls=true&replicaSet=rs0&readPreference=primary&retryWrites=false&authSource=admin`);u.username=username;u.password=password;return new MongoClient(u.href,{tlsCAFile:'/app/reconciliation/rds.pem',serverSelectionTimeoutMS:15000,connectTimeoutMS:10000,socketTimeoutMS:15000,maxPoolSize:2,appName:'identity-confidential-reconciliation'}).connect()};
let admin,reader,phase='configuration',createdRole=false,createdUser=false;
const cognito=new CognitoIdentityProviderClient({region:'us-east-1',maxAttempts:2});
try {
 phase='temporary-read-access';admin=await connect(process.env.RECONCILE_ADMIN_USERNAME,process.env.RECONCILE_ADMIN_PASSWORD);delete process.env.RECONCILE_ADMIN_PASSWORD;delete process.env.RECONCILE_ADMIN_USERNAME;
 const dbAdmin=admin.db('admin');
 assert.equal((await dbAdmin.command({usersInfo:user})).users.length,0);assert.equal((await dbAdmin.command({rolesInfo:role})).roles.length,0);
 const privileges=names.map(collection=>({resource:{db:database,collection},actions:['find']}));
 await dbAdmin.command({createRole:role,privileges,roles:[]});createdRole=true;
 const password=randomBytes(32).toString('hex');await dbAdmin.command({createUser:user,pwd:password,roles:[{role,db:'admin'}]});createdUser=true;
 phase='verify-find-only-role';
 const info=(await dbAdmin.command({rolesInfo:role,showPrivileges:true})).roles[0];assert.deepEqual(info.roles,[]);
 assert.equal(info.privileges.length,names.length);
 for(const name of names){const grants=info.privileges.filter(p=>p.resource?.db===database&&p.resource?.collection===name);assert.equal(grants.length,1);assert.deepEqual(grants[0].actions,['find']);}
 phase='connect-read-only-login';
 reader=await connect(user,password);
 phase='bounded-read-only-comparison';
 const accounts=[];for await(const page of paginateListUsers({client:cognito,pageSize:60},{UserPoolId:'us-east-1_1UW5OrB7T'},{abortSignal:AbortSignal.timeout(15000)})){
  for(const u of page.Users??[]){const attrs=Object.fromEntries((u.Attributes??[]).map(a=>[a.Name,a.Value]));accounts.push({subject:attrs.sub,enabled:u.Enabled===true,confirmed:u.UserStatus==='CONFIRMED',verified:attrs.email_verified==='true'});}assert(accounts.length<=1000);
 }
 const projection={_id:0,principalId:1,cognitoSubject:1,tenantId:1,workspaceId:1,status:1,authorizationEpoch:1,membershipId:1,roles:1,policyId:1,policyRevisionId:1,breakGlassExpiresAt:1};
 const data=[];for(const name of names){const rows=await reader.db(database).collection(name).find({},{projection,maxTimeMS:10000}).limit(1001).toArray();assert(rows.length<=1000);data.push(rows);}
 console.info(JSON.stringify({check:'production-canonical-reconciliation',readOnlyCollections:3,...reconcile(accounts,...data),pointInTimeSnapshot:false,accountDataExported:false}));
} catch(e){console.error(JSON.stringify({check:'production-canonical-reconciliation',passed:false,phase,code:typeof e?.code==='number'||e?.code==='ERR_ASSERTION'?e.code:undefined}));process.exitCode=1;}
finally{
 await reader?.close();cognito.destroy();
 try{if(createdUser)await admin.db('admin').command({dropUser:user});if(createdRole)await admin.db('admin').command({dropRole:role});console.info(JSON.stringify({check:'temporary-database-access-cleanup',userRemoved:createdUser,roleRemoved:createdRole}));}
 catch{console.error(JSON.stringify({check:'temporary-database-access-cleanup',passed:false}));process.exitCode=1;}
 await admin?.close();
}

// Explicit opt-in combined integration against the private, baseline-bound application source.
// Actual provider handlers/keys/PKCE and app callback execute; only HTTP transport is in-process.
// PostgreSQL and MongoDB are real loopback test databases. No real mail or account enrollment.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Page } from 'playwright';
import type { Pool } from 'pg';
import type { Config } from '../../src/core/config.js';
export async function verifyApplicationCallback(args: {
  root: string; config: Config; app: (request: Request, ip: string) => Promise<Response>;
  page: Page; owner: Pool; principalId: string; email: string; revoke: () => Promise<void>;
}) {
  const root = resolve(args.root), require = createRequire(resolve(root, 'package.json'));
  const { register } = require('tsx/cjs/api');
  const load = register({ namespace: 'identity-combined-' + randomUUID() });
  const originalFetch = globalThis.fetch;
  const envNames = ['MONGODB_URI','MONGODB_DB_NAME','AUTH_IDENTITY_PROVIDER','IDENTITY_ISSUER','IDENTITY_REDIRECT_URI',
    'IDENTITY_CLIENT_ID','IDENTITY_FLOW_SECRET','IDENTITY_FLOW_SEED','IDENTITY_SESSION_STATUS_SECRET','SESSION_SECRET',
    'STATE_AUTHORIZATION_MODE','STATE_IDENTITY_PROVIDER','SITE_SURFACE'];
  const prior = new Map(envNames.map(name => [name, process.env[name]]));
  let mongo: any;
  try {
    Object.assign(process.env, { MONGODB_URI: 'mongodb://127.0.0.1:55433/mirror_identity_synthetic', MONGODB_DB_NAME:'mirror_identity_synthetic',
      AUTH_IDENTITY_PROVIDER:'mirror', IDENTITY_ISSUER:args.config.origin+'/api/auth', IDENTITY_REDIRECT_URI:args.config.redirectUris[0],
      IDENTITY_CLIENT_ID:args.config.oidcClientId, IDENTITY_FLOW_SECRET:randomBytes(32).toString('base64url'),
      IDENTITY_SESSION_STATUS_SECRET:args.config.sessionStatusSecret, SESSION_SECRET:randomBytes(48).toString('hex'),
      STATE_AUTHORIZATION_MODE:'authoritative', STATE_IDENTITY_PROVIDER:'cognito', SITE_SURFACE:'platform' });
    delete process.env.IDENTITY_FLOW_SEED;
    // Deny all destinations other than the isolated real service handler, including production networks.
    globalThis.fetch = async (input, init) => {
      const request = input instanceof Request ? new Request(input, init) : new Request(input, init);
      assert.equal(new URL(request.url).origin,args.config.origin);
      return args.app(request,'198.18.250.1');
    };
    const module = async (path: string) => load.require(resolve(root,path),resolve(root,'package.json'));
    const dbModule = await module('lib/mongodb.ts');
    const db = await dbModule.getDb(); mongo = await dbModule.getMongoClient();
    const identity = await module('lib/state-kernel/authorization/identity.ts');
    const session = await module('lib/state-kernel/authorization/session.ts');
    const start = await module('pages/api/auth/start.ts'), callback = await module('pages/api/auth/callback.ts');
    const handler = (m: any) => typeof m.default === 'function' ? m.default : m.default.default;
    const user = (await args.owner.query('SELECT id FROM "user" WHERE email=$1',[args.email])).rows[0].id;
    const scope={tenantId:'combined-'+randomUUID(),workspaceId:'combined-'+randomUUID()}, membershipId=randomUUID(), policyRevisionId=randomUUID();
    await db.collection('authorization_principals').insertOne({principalId:args.principalId,cognitoSubject:randomUUID(),...scope,status:'active',authorizationEpoch:7,email:args.email});
    await db.collection('authorization_memberships').insertOne({principalId:args.principalId,membershipId,...scope,status:'active',roles:['admin']});
    await db.collection('authorization_policy_heads').insertOne({...scope,policyRevisionId,policyId:'combined-synthetic'});
    await db.collection('authorization_identity_mappings').insertOne({_id:identity.identityMappingId(process.env.IDENTITY_ISSUER,user),issuer:process.env.IDENTITY_ISSUER,subject:user,principalId:args.principalId,enabled:true,reviewRef:'synthetic-combined-review'});
    const response = () => {
      const headers=new Map<string,any>();
      const res:any={statusCode:200,headers,getHeader:(k:string)=>headers.get(k.toLowerCase()),setHeader:(k:string,v:any)=>headers.set(k.toLowerCase(),v),
        status:(n:number)=>{res.statusCode=n;return res;},end:()=>res,json:()=>res,
        redirect:(n:number,url:string)=>{res.statusCode=n;headers.set('location',url);return res;}};
      return res;
    };
    const startRes=response();await handler(start)({method:'GET',query:{next:'/workspace'},headers:{}},startRes);
    assert.equal(startRes.statusCode,302,'actual application start');
    const cookieList = (res:any):string[] => {const c=res.getHeader('set-cookie');return c===undefined?[]:Array.isArray(c)?c:[c];};
    const flowCookie=cookieList(startRes).map(c=>c.split(';')[0]).join('; ');
    const providerCookies=await args.page.context().cookies(args.config.origin);
    const authorization=await args.app(new Request(startRes.getHeader('location'),{headers:{cookie:providerCookies.map(c=>c.name+'='+c.value).join('; ')}}),'198.18.250.2');
    assert.equal(authorization.status,302,'actual provider authorize');
    const redirect=new URL(authorization.headers.get('location')!);assert.equal(redirect.origin,new URL(args.config.redirectUris[0]!).origin);
    const request={method:'GET',url:redirect.pathname+redirect.search,query:Object.fromEntries(redirect.searchParams),headers:{cookie:flowCookie}};
    const callbackRes=response();await handler(callback)(request,callbackRes);
    assert.equal(callbackRes.statusCode,302,'actual application callback');assert.equal(callbackRes.getHeader('location'),'/workspace');
    const appRequest={headers:{cookie:cookieList(callbackRes).map(c=>c.split(';')[0]).join('; ')}};
    const resolved=await session.resolveOpaqueAuthorizationSession(appRequest);
    assert.equal(resolved?.principal.principalId,args.principalId);assert.equal(resolved?.membership.membershipId,membershipId);
    assert.deepEqual(resolved?.membership.roles,['admin']);assert.equal(resolved?.session.authorizationEpoch,7);
    assert.equal(resolved?.session.identityBinding.epoch,'9007199254740993');
    assert.equal(resolved?.session.identityBinding.requirePrivileged,true);
    const replay=response();await handler(callback)(request,replay);assert.equal(replay.statusCode,404,'callback replay fails closed');
    await db.collection('authorization_memberships').updateOne({membershipId},{$set:{status:'disabled'}});
    assert.equal(await session.resolveOpaqueAuthorizationSession(appRequest),null);
    await db.collection('authorization_memberships').updateOne({membershipId},{$set:{status:'active'}});
    await args.revoke();assert.equal(await session.resolveOpaqueAuthorizationSession(appRequest),null,'real provider revocation denies app session');
    console.info('Combined real provider + application callback + MongoDB mapping/session/replay/disabled-membership/revocation checks passed (in-process transport, synthetic enrollment)');
  } finally {
    globalThis.fetch=originalFetch;
    if(mongo)await mongo.close();
    await load.unregister();
    for(const [name,value] of prior)if(value===undefined)delete process.env[name];else process.env[name]=value;
  }
}

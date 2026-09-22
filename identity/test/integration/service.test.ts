/** Real Better Auth + real PostgreSQL tests. Never run against non-synthetic storage. */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import { createLocalJWKSet, jwtVerify } from "jose";
import { loadConfig, assertSyntheticDatabase } from "../../src/core/config.js";
import { createPool, Store } from "../../src/db.js";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import { opaqueToken, digest, responseCookies, verifiedTotpDigest } from "../../src/core/tokens.js";
const config = loadConfig();
assertSyntheticDatabase(process.env.MIGRATION_DATABASE_URL ?? "");
const owner = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const pool = createPool(config);
const store = new Store(pool);
const auth = createAuth(config, store);
const app = createApp(config, store, auth);
const password = "Synthetic-test-password-not-a-real-credential!";
let nextBrowser = randomInt(1, 60_000);
class Browser {
  headers = new Headers({ origin: config.origin });
  readonly ip = `198.18.${Math.floor(nextBrowser / 250)}.${nextBrowser++ % 250 + 1}`;
  async request(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<Response> {
    const headers = new Headers(this.headers);
    if (body !== undefined) headers.set("content-type", "application/json");
    const response = await app(new Request(config.origin + path, { method, headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), this.ip);
    this.headers.set("cookie", responseCookies(this.headers, response.headers).get("cookie") ?? "");
    return response;
  }
}
async function fixture(options: { disabled?: boolean; privileged?: boolean; email?: string } = {}) {
  const id = `mp-test-${randomUUID()}`, email = options.email ?? `${randomUUID()}@example.invalid`, token = opaqueToken();
  await owner.query("INSERT INTO mirror_principal(id,disabled,privileged) VALUES ($1,$2,$3)", [id, options.disabled ?? false, options.privileged ?? false]);
  await owner.query(`INSERT INTO mirror_invitation(digest,principal_id,email,issuer_ref,evidence_kind,expires_at)
    VALUES ($1,$2,$3,'synthetic-test-operator','synthetic-only',now()+interval '10 minutes')`, [digest(token), id, email]);
  return { id, email, token };
}
async function enrolledBrowser() {
  const f=await fixture(), browser=new Browser();
  const response=await browser.request("/api/identity/enroll",{invitation:f.token,name:"Synthetic User",password});
  assert.equal(response.status,201,"Expected successful synthetic ceremony");
  const login=await browser.request("/api/auth/sign-in/email",{email:f.email,password});
  assert.equal(login.status,200,"Expected successful synthetic ceremony");
  return { ...f, browser };
}
/** Test fixture only: RFC 6238 HMAC generation, NOT a production verifier. */
function totp(uri: string, offsetSeconds=0): string {
  const secret=new URL(uri).searchParams.get("secret")!;
  let bits="";
  for(const c of secret.replace(/=+$/,"")) bits += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c.toUpperCase()).toString(2).padStart(5,"0");
  const bytes=[];for(let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.slice(i,i+8),2));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor((Date.now()/1000+offsetSeconds)/30)));
  const mac=createHmac("sha1",Buffer.from(bytes)).update(counter).digest();
  const at=mac[mac.length-1]! & 15;
  return ((mac.readUInt32BE(at)&0x7fffffff)%1_000_000).toString().padStart(6,"0");
}
async function withTotp() {
  const f=await enrolledBrowser();
  const enabled=await f.browser.request("/api/auth/two-factor/enable",{password});
  assert.equal(enabled.status,200);
  const setup=await enabled.json() as { totpURI: string; backupCodes: string[] };
  assert.ok(setup.totpURI?.startsWith("otpauth://"));assert.equal(setup.backupCodes.length,10);
  const verified=await f.browser.request("/api/auth/two-factor/verify-totp",{code:totp(setup.totpURI)});
  assert.equal(verified.status,200,"Expected successful synthetic ceremony");
  const status=await f.browser.request("/api/identity/session");
  if(status.status===200) assert.equal((await status.json() as {mfaCompleted:boolean}).mfaCompleted,false);
  await f.browser.request("/api/auth/sign-out",{});
  return {...f,...setup};
}
async function completeTotp(f: Awaited<ReturnType<typeof withTotp>>) {
  const signed=await f.browser.request("/api/auth/sign-in/email",{email:f.email,password});
  assert.equal(signed.status,200);
  assert.equal((await signed.json() as {twoFactorRedirect:boolean}).twoFactorRedirect,true);
  // Registration consumed this code in Mirror's replay ledger. Use a new code for the login ceremony.
  const wait=30_000-(Date.now()%30_000)+100;
  await new Promise(resolve=>setTimeout(resolve,wait));
  const response=await f.browser.request("/api/auth/two-factor/verify-totp",{code:totp(f.totpURI)});
  assert.equal(response.status,200,"Expected successful synthetic ceremony");
  const status=await f.browser.request("/api/identity/session");
  assert.equal((await status.json() as {mfaCompleted:boolean}).mfaCompleted,true);
}
function authorizationQuery(verifier=opaqueToken()) {
  return {verifier,params:new URLSearchParams({client_id:config.oidcClientId,redirect_uri:config.redirectUris[0]!,
    response_type:"code",scope:"openid profile email",state:opaqueToken(),nonce:opaqueToken(),
    code_challenge_method:"S256",code_challenge:createHash("sha256").update(verifier).digest("base64url")})};
}
before(async()=>{
  await owner.query(`INSERT INTO "oauthClient" (id,"clientId","redirectUris",scopes,"grantTypes","responseTypes",
    "tokenEndpointAuthMethod","requirePKCE",disabled,"skipConsent","subjectType","clientCredentialsScopes")
    VALUES ($1,$2,$3::jsonb,'["openid","profile","email"]'::jsonb,'["authorization_code"]'::jsonb,
      '["code"]'::jsonb,'none',true,false,true,'public','[]'::jsonb) ON CONFLICT ("clientId") DO NOTHING`,
    [randomUUID(),config.oidcClientId,JSON.stringify(config.redirectUris)]);
});
after(async()=>{await pool.end();await owner.end();});
test("public signup, dynamic registration, mail, password reset and alternate token minting are not exposed",async()=>{
  const browser=new Browser();
  for(const path of ["/api/auth/sign-up/email","/api/auth/oauth2/register","/api/auth/oauth2/client/create",
    "/api/auth/send-verification-email","/api/auth/request-password-reset","/api/auth/token","/api/auth/oauth2/continue",
    "/api/auth/two-factor/disable","/api/auth/passkey/delete-passkey"]) {
    const result=await browser.request(path,{});assert.equal(result.status,404,path);
  }
});
test("CSRF requests are rejected before credentials are evaluated",async()=>{
  const result=await app(new Request(config.origin+"/api/identity/enroll",{method:"POST",headers:{origin:"https://attacker.invalid","content-type":"application/json"},body:"{}"}));
  assert.equal(result.status,403);
});
test("unprivileged runtime cannot activate a principal, register a client, or change invitation identity",async()=>{
  const f=await fixture();
  await assert.rejects(pool.query("UPDATE mirror_principal SET disabled=false WHERE id=$1",[f.id]),/permission denied/);
  await assert.rejects(pool.query('UPDATE "oauthClient" SET "skipConsent"=true'),/permission denied/);
  await assert.rejects(pool.query("UPDATE mirror_invitation SET email='attacker@example.invalid' WHERE digest=$1",[digest(f.token)]),/permission denied/);
});
test("invitation consumption and explicit binding are atomic under concurrency",async()=>{
  const f=await fixture(),a=new Browser(),b=new Browser();
  const results=await Promise.all([a,b].map(browser=>browser.request("/api/identity/enroll",{invitation:f.token,name:"Synthetic",password})));
  assert.equal(results.filter(r=>r.status===201).length,1);
  const {rows}=await owner.query("SELECT user_id FROM mirror_binding WHERE principal_id=$1",[f.id]);assert.equal(rows.length,1);
});
test("disabled and privileged invitations fail closed without consuming their token",async()=>{
  for(const flags of [{disabled:true},{privileged:true}]) {
    const f=await fixture(flags),browser=new Browser();
    const result=await browser.request("/api/identity/enroll",{invitation:f.token,name:"Synthetic",password});assert.equal(result.status,403);
    const {rows}=await owner.query("SELECT consumed_at FROM mirror_invitation WHERE digest=$1",[digest(f.token)]);assert.equal(rows[0].consumed_at,null);
  }
});
test("email collision never relinks or merges a principal",async()=>{
  const a=await enrolledBrowser(),b=await fixture({email:a.email}),browser=new Browser();
  const result=await browser.request("/api/identity/enroll",{invitation:b.token,name:"Second principal",password});assert.notEqual(result.status,201);
  const {rows}=await owner.query("SELECT principal_id FROM mirror_binding WHERE principal_id=ANY($1::text[])",[[a.id,b.id]]);
  assert.deepEqual(rows.map(r=>r.principal_id),[a.id]);
});
test("caller-supplied identity and role fields are rejected",async()=>{
  const f=await fixture(),browser=new Browser();
  const result=await browser.request("/api/identity/enroll",{invitation:f.token,name:"Synthetic",password,principalId:"admin",role:"admin"});assert.equal(result.status,400);
});
test("password-only session cannot authorize OIDC or forge passkey evidence",async()=>{
  const f=await enrolledBrowser(),{params}=authorizationQuery();
  const denied=await f.browser.request("/api/auth/oauth2/authorize?"+params);assert.equal(denied.status,401);
  const forged=await f.browser.request("/api/auth/passkey/verify-authentication",{verified:true,userVerified:true,response:{}});assert.ok(forged.status>=400);
  const state=await f.browser.request("/api/identity/session");assert.equal((await state.json() as {mfaCompleted:boolean}).mfaCompleted,false);
});
test("TOTP enrollment alone is insufficient; fresh password/TOTP permits OIDC, then epoch revocation blocks issuance",{timeout:90_000},async()=>{
  const f=await withTotp();await completeTotp(f);
  const {params,verifier}=authorizationQuery();
  const authorized=await f.browser.request("/api/auth/oauth2/authorize?"+params);
  assert.ok([302,303].includes(authorized.status),"Expected successful synthetic ceremony");
  const callback=new URL(authorized.headers.get("location")!);
  assert.equal(callback.origin+callback.pathname,config.redirectUris[0]);assert.equal(callback.searchParams.get("state"),params.get("state"));
  const code=callback.searchParams.get("code");assert.ok(code);
  const form=new URLSearchParams({grant_type:"authorization_code",client_id:config.oidcClientId,
    redirect_uri:config.redirectUris[0]!,code,code_verifier:verifier});
  const tokenRequest=()=>app(new Request(config.origin+"/api/auth/oauth2/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:form.toString()}),f.browser.ip);
  const tokens=await tokenRequest();assert.equal(tokens.status,200,"Expected successful synthetic ceremony");
  const tokenBody=await tokens.json() as {id_token:string};assert.ok(tokenBody.id_token);
  const keys=await f.browser.request("/api/auth/jwks");const jwks=await keys.json();
  const {payload}=await jwtVerify(tokenBody.id_token,createLocalJWKSet(jwks),{issuer:config.origin+"/api/auth",audience:config.oidcClientId});
  assert.equal(payload.nonce,params.get("nonce"));assert.equal(payload["https://mirrorprogress.com/principal_id"],f.id);
  assert.notEqual(payload.sub,f.email);assert.notEqual(payload.sub,f.id);
  const assurance=payload["https://mirrorprogress.com/assurance"] as {method:string;verified_at:number};assert.equal(assurance.method,"password_totp");
  assert.ok(assurance.verified_at<=Date.now()/1000);
  const replay=await tokenRequest();assert.ok(replay.status>=400);
  await owner.query("UPDATE mirror_principal SET authorization_epoch=authorization_epoch+1 WHERE id=$1",[f.id]);
  const blocked=await f.browser.request("/api/auth/oauth2/authorize?"+authorizationQuery().params);assert.equal(blocked.status,401);
});
test("recovery code consumption revokes sessions and queues invalidation, never upgrades assurance",{timeout:60_000},async()=>{
  const f=await withTotp();
  const signIn=await f.browser.request("/api/auth/sign-in/email",{email:f.email,password});assert.equal(signIn.status,200);
  const result=await f.browser.request("/api/auth/two-factor/verify-backup-code",{code:f.backupCodes[0]});assert.equal(result.status,200,"Expected successful synthetic ceremony");
  assert.equal((await result.json() as {mfaCompleted:boolean}).mfaCompleted,false);
  const {rows}=await owner.query("SELECT p.authorization_epoch::text AS epoch, o.kind FROM mirror_principal p JOIN mirror_security_outbox o ON o.principal_id=p.id WHERE p.id=$1",[f.id]);
  assert.equal(rows[0].epoch,"1");assert.equal(rows[0].kind,"recovery");
  const retryLogin=await f.browser.request("/api/auth/sign-in/email",{email:f.email,password});assert.equal(retryLogin.status,200);
  const replay=await f.browser.request("/api/auth/two-factor/verify-backup-code",{code:f.backupCodes[0]});assert.equal(replay.status,401);
});
test("TOTP and backup material are encrypted by the configured library, not stored as the displayed values",async()=>{
  const f=await withTotp();
  const {rows}=await owner.query(`SELECT t.secret,t."backupCodes" FROM "twoFactor" t JOIN "user" u ON u.id=t."userId" WHERE u.email=$1`,[f.email]);
  const secret=new URL(f.totpURI).searchParams.get("secret")!;
  assert.ok(rows[0]);assert.notEqual(rows[0].secret,secret);
  assert.ok(!rows[0].backupCodes.includes(f.backupCodes[0]));
});
test("distributed rate limiting is atomic across concurrent requests",async()=>{
  const key=`synthetic-limit:${randomUUID()}`;
  const results=await Promise.allSettled(Array.from({length:12},()=>store.rateLimit(key,5)));
  assert.equal(results.filter(r=>r.status==="fulfilled").length,5);
});

test("a verified TOTP replay claim has one atomic winner across separate sessions",async()=>{
  const f=await enrolledBrowser();
  const { rows }=await owner.query('SELECT id FROM "user" WHERE email=$1',[f.email]);
  const codeDigest=verifiedTotpDigest(config.secret, rows[0].id, "123456");
  const results=await Promise.allSettled(Array.from({length:8},()=>store.reserveVerifiedTotp(rows[0].id,codeDigest)));
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
});
test("a password challenge cannot regain assurance after its original epoch is revoked",async()=>{
  const f=await enrolledBrowser();
  const context=await auth.api.getSession({headers:f.browser.headers});assert.ok(context);
  // Snapshot exactly the evidence epoch supplied by a completed password-flow record.
  const oldEpoch=(await store.principal(context.user.id)).epoch;
  await owner.query("UPDATE mirror_principal SET authorization_epoch=authorization_epoch+1 WHERE id=$1",[f.id]);
  await assert.rejects(store.recordEvidence(context,"password_totp",Date.now()-1000,Date.now(),oldEpoch,
    verifiedTotpDigest(config.secret,context.user.id,"123456")),/authorization_epoch_changed/);
});

test("discovery describes only the exposed first-party code profile",async()=>{
  const response=await new Browser().request("/api/auth/.well-known/openid-configuration");assert.equal(response.status,200);
  const metadata=await response.json() as Record<string,unknown>;
  assert.equal(metadata.issuer,config.origin+"/api/auth");
  assert.equal(metadata.userinfo_endpoint,undefined);assert.equal(metadata.registration_endpoint,undefined);
  assert.deepEqual(metadata.grant_types_supported,["authorization_code"]);
});
test("signout cancels a pending password challenge even before a session exists",async()=>{
  const f=await withTotp();
  assert.equal((await f.browser.request("/api/auth/sign-in/email",{email:f.email,password})).status,200);
  await f.browser.request("/api/auth/sign-out",{});
  const result=await f.browser.request("/api/auth/two-factor/verify-totp",{code:totp(f.totpURI)});
  assert.ok(result.status>=400);
});

test("library rate limits use the transport peer, ignore spoofed headers, and isolate clients",async()=>{
  const f=await enrolledBrowser();
  for (let i=0;i<2;i++) {
    f.browser.headers.set("x-mirror-transport-ip",`198.19.0.${i+1}`);
    f.browser.headers.set("x-forwarded-for",`198.19.1.${i+1}`);
    assert.equal((await f.browser.request("/api/auth/sign-in/email",{email:f.email,password:"Incorrect-password!"})).status,401);
  }
  f.browser.headers.set("x-mirror-transport-ip","198.19.0.99");
  const blocked=await f.browser.request("/api/auth/sign-in/email",{email:f.email,password});
  assert.equal(blocked.status,429);
  const other=new Browser();
  assert.equal((await other.request("/api/auth/sign-in/email",{email:f.email,password})).status,200);
  const {rows}=await owner.query('SELECT count FROM "rateLimit" WHERE key=$1',[`${f.browser.ip}|/sign-in/email`]);
  assert.equal(Number(rows[0].count),3);
});

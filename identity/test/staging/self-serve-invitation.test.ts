/**
 * Local PostgreSQL only (SELF_SERVE_TEST_OWNER_URL, loopback, database mirror_identity_self_serve_test).
 * Applies migrations 001-006 and 008 and the least-privilege grants, then exercises migration 008 through the
 * real runtime role, the StagingStore and the HTTP route. Fake delivery; no mailbox or network.
 */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { Config } from "../../src/core/config.js";
import { PolicyError } from "../../src/core/policy.js";
import { FakeEnrollmentTransport } from "../../src/core/delivery.js";
import { digest, opaqueToken } from "../../src/core/tokens.js";
import { SELF_SERVE_PRINCIPAL, StagingStore } from "../../src/staging/store.js";
import { createAuth } from "../../src/auth.js";
import { createApp } from "../../src/app.js";
import { applyLocalPreviewSchema } from "../../scripts/local-preview-schema.js";

const ownerUrl = new URL(process.env.SELF_SERVE_TEST_OWNER_URL ?? "postgresql://unset@127.0.0.1/unset");
const enabled = Boolean(process.env.SELF_SERVE_TEST_OWNER_URL);
const DATABASE = "mirror_identity_self_serve_test", RUNTIME = "mirror_identity_self_serve_test_runtime";
const runtimePassword = randomBytes(32).toString("hex");
const statusSecret = randomBytes(32).toString("hex");
const selfServeSecret = randomBytes(32).toString("hex");
let owner: Pool, runtime: Pool, store: StagingStore, app: ReturnType<typeof createApp>, config: Config;

before(async () => {
  if (!enabled) return;
  assert.equal(ownerUrl.hostname, "127.0.0.1");
  assert.equal(ownerUrl.pathname, `/${DATABASE}`);
  process.env.IDENTITY_LOCAL_PREVIEW = "1";
  process.env.IDENTITY_MAIL_DELIVERY = "local-file";
  process.env.IDENTITY_LOCAL_PREVIEW_OUTBOX = `/tmp/self-serve-test-${randomUUID()}.jsonl`;
  const maintenance = new URL(ownerUrl); maintenance.pathname = "/postgres";
  const admin = new Pool({ connectionString: maintenance.href, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DATABASE}`);
  await admin.end();
  const runtimeUrl = new URL(ownerUrl); runtimeUrl.username = RUNTIME; runtimeUrl.password = runtimePassword;
  config = { mode: "production", freshInstall: true, origin: "http://localhost:3040", databaseUrl: runtimeUrl.href,
    secret: randomBytes(48).toString("hex"), sessionStatusSecret: statusSecret, selfServeSecret, bindHost: "127.0.0.1", port: 3040,
    platformOrigin: "http://127.0.0.1:3031", oidcClientId: "mirror-self-serve-test",
    redirectUris: ["http://127.0.0.1:3031/api/auth/callback"],
    staging: { rpId: "localhost", deliveryKey: randomBytes(32).toString("base64url"), certFile: "/unused", keyFile: "/unused" } };
  owner = new Pool({ connectionString: ownerUrl.href, max: 4 });
  await applyLocalPreviewSchema(owner, config, runtimePassword,
    { database: DATABASE, runtimeRole: RUNTIME, operatorRole: "mirror_identity_self_serve_test_operator" });
  runtime = new Pool({ connectionString: runtimeUrl.href, max: 4 });
  store = new StagingStore(runtime, config);
  app = createApp(config, store, createAuth(config, store));
});
after(async () => { await runtime?.end(); await owner?.end(); });

const issue = (email: string, company = "Sample Studio", trialDays?: number) =>
  store.issueSelfServeInvitation({ name: "Sample Person", email, company, ...(trialDays === undefined ? {} : { trialDays }) });
const sqlIssue = (email: string, company = "Sample Studio") =>
  runtime.query("SELECT mirror_self_serve_issue($1,$2,$3,$4,$5,$6)", [randomUUID(), digest(opaqueToken()), email, "Sample Person", company, 14]);

test("runtime role issues only an external/client invitation recorded against the self-serve principal", { skip: !enabled }, async () => {
  const result = await issue("ada@sample-one.example");
  assert.equal(result.status, "queued");
  const principalId = (result as { principalId: string }).principalId;
  const { rows } = await owner.query(`SELECT p.privileged,p.disabled,m.account_type,m.requested_role,m.inviter,
      i.issuer,r.reconciler,(SELECT count(*) FROM mirror_staging_audit a WHERE a.principal_id=p.id AND a.kind='self-serve-invite')::int AS audits
    FROM mirror_principal p JOIN mirror_managed_invitation m ON m.principal_id=p.id
    JOIN mirror_staging_invitation i ON i.digest=m.invitation_digest
    JOIN mirror_staging_reconciliation r ON r.principal_id=p.id WHERE p.id=$1`, [principalId]);
  assert.deepEqual(rows[0], { privileged: false, disabled: false, account_type: "external", requested_role: "client",
    inviter: SELF_SERVE_PRINCIPAL, issuer: SELF_SERVE_PRINCIPAL, reconciler: SELF_SERVE_PRINCIPAL, audits: 1 });
  // The queued email carries a one-time account link that the invitation-info route accepts.
  const transport = new FakeEnrollmentTransport();
  assert.equal(await store.dispatchOne(transport), "sent");
  const [message] = [...transport.messages.values()];
  assert.equal(message?.to, "ada@sample-one.example");
  const token = decodeURIComponent(new URL(message!.url).hash.replace("#invitation=", ""));
  assert.deepEqual(await store.managedInvitationInfo(token), { name: "Sample Person", company: "Sample Studio", email: "ada@sample-one.example" });
});

test("runtime role cannot bypass the function: no direct writes, no admin issuance without a passkey session", { skip: !enabled }, async () => {
  await assert.rejects(runtime.query("INSERT INTO mirror_principal(id) VALUES ($1)", [randomUUID()]), { code: "42501" });
  await assert.rejects(runtime.query(`INSERT INTO mirror_managed_invitation(principal_id,invitation_digest,email,display_name,
    company_name,account_type,requested_role,inviter) VALUES ('x','y','z@a.b','n','c','admin','admin','x')`), { code: "42501" });
  await assert.rejects(runtime.query("SELECT mirror_managed_issue($1,$2,$3,$4,$5,$6,$7,$8)",
    ["no-session", randomUUID(), digest(opaqueToken()), "admin@sample.example", "A", "Mirror Progress", "admin", "admin"]), { code: "42501" });
  for (const [email, company] of [["staff@mirrorprogress.com", "Sample"], ["x@sample-two.example", "Mirror Progress"],
    ["Upper@Sample.example", "Sample"]]) await assert.rejects(sqlIssue(email!, company), { code: "42501" });
});

test("the requested trial length is stored with the invitation and used in the trial email", { skip: !enabled }, async () => {
  const result = await issue("lin@sample-eight.example", "Sample Eight", 30);
  assert.equal(result.status, "queued");
  const { rows } = await owner.query("SELECT trial_days FROM mirror_managed_invitation WHERE principal_id=$1",
    [(result as { principalId: string }).principalId]);
  assert.equal(rows[0]?.trial_days, 30);
  const transport = new FakeEnrollmentTransport();
  while (await store.dispatchOne(transport) === "sent") { /* drain earlier queued messages */ }
  const message = [...transport.messages.values()].find((item) => item.to === "lin@sample-eight.example");
  assert.equal(message?.invitationKind, "self_serve_trial");
  assert.equal(message?.trialDays, 30);
  await assert.rejects(runtime.query("SELECT mirror_self_serve_issue($1,$2,$3,$4,$5,$6)",
    [randomUUID(), digest(opaqueToken()), "x@sample-nine.example", "Sample", "Sample Nine", 366]), { code: "42501" });
});

test("duplicates do not mint a second account; resends are throttled to one per 15 minutes", { skip: !enabled }, async () => {
  const first = await issue("grace@sample-three.example");
  assert.equal(first.status, "queued");
  assert.deepEqual(await issue("grace@sample-three.example"), { status: "pending" });
  await owner.query(`UPDATE mirror_staging_invitation SET created_at=created_at-interval '20 minutes',
    expires_at=expires_at-interval '20 minutes' WHERE email='grace@sample-three.example'`);
  assert.deepEqual(await issue("grace@sample-three.example"), { status: "resent" });
  const { rows } = await owner.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE consumed_at IS NULL)::int AS open
    FROM mirror_staging_invitation WHERE email='grace@sample-three.example'`);
  assert.deepEqual(rows[0], { total: 2, open: 1 });
  assert.deepEqual(await issue("grace@sample-three.example"), { status: "pending" }, "second resend inside 15 minutes is refused");
});

test("existing accounts and human-issued pending invitations are never re-issued", { skip: !enabled }, async () => {
  await owner.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,'Existing','existing@sample-four.example',true,now(),now())`, [randomUUID()]);
  assert.deepEqual(await issue("existing@sample-four.example"), { status: "exists" });
  const human = randomUUID(), target = randomUUID(), hash = digest(opaqueToken());
  await owner.query("INSERT INTO mirror_principal(id,privileged) VALUES ($1,true)", [human]);
  await owner.query("INSERT INTO mirror_principal(id) VALUES ($1)", [target]);
  await owner.query("INSERT INTO mirror_staging_reconciliation(principal_id,epoch,email,reconciler,review_ref) VALUES ($1,0,'pending@sample-four.example',$2,'synthetic review')", [target, human]);
  await owner.query("INSERT INTO mirror_staging_invitation(digest,principal_id,epoch,email,issuer,created_at,expires_at) VALUES ($1,$2,0,'pending@sample-four.example',$3,now()-interval '1 hour',now()+interval '1 day')", [hash, target, human]);
  await owner.query(`INSERT INTO mirror_managed_invitation(principal_id,invitation_digest,email,display_name,company_name,account_type,requested_role,inviter)
    VALUES ($1,$2,'pending@sample-four.example','Pending','Sample Four','external','client',$3)`, [target, hash, human]);
  assert.deepEqual(await issue("pending@sample-four.example"), { status: "pending" });
  await assert.rejects(runtime.query("SELECT mirror_self_serve_resend($1,$2)", [target, digest(opaqueToken())]), { code: "42501" });
});

test("the database enforces a per-domain daily ceiling and a kill switch", { skip: !enabled }, async () => {
  for (let index = 0; index < 5; index++) await sqlIssue(`person${index}@sample-five.example`);
  await assert.rejects(sqlIssue("person5@sample-five.example"), { code: "54000" });
  await assert.rejects(issue("person6@sample-five.example"), (error: unknown) =>
    error instanceof PolicyError && error.code === "self_serve_capacity_reached" && error.status === 429);
  await owner.query("UPDATE mirror_principal SET disabled=true WHERE id=$1", [SELF_SERVE_PRINCIPAL]);
  try {
    await assert.rejects(issue("someone@sample-six.example"), (error: unknown) =>
      error instanceof PolicyError && error.code === "self_serve_unavailable");
  } finally { await owner.query("UPDATE mirror_principal SET disabled=false WHERE id=$1", [SELF_SERVE_PRINCIPAL]); }
});

test("HTTP route issues through the real store and returns only a coarse status", { skip: !enabled }, async () => {
  const response = await app(new Request("http://localhost:3040/internal/identity/self-serve-trial-invitations", {
    method: "POST", headers: { authorization: `Bearer ${selfServeSecret}`, "content-type": "application/json" },
    body: JSON.stringify({ name: "Route Person", email: "route@sample-seven.example", company: "Sample Seven" }) }));
  assert.equal(response.status, 202);
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.status, "queued");
  assert.deepEqual(Object.keys(body).sort(), ["principalId", "status"]);
});

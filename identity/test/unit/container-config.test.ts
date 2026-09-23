import test from "node:test";
import assert from "node:assert/strict";
import { stagingContainerEnvironment } from "../../src/core/container-config.js";
import { STAGING } from "../../src/core/staging-config.js";
const credentials = { username: STAGING.runtimeRole, dbname: "mirror_identity_staging", engine: "postgres", port: 5432, password: "a".repeat(64) };
const env = { IDENTITY_MODE: "staging", IDENTITY_TRANSPORT: "alb", IDENTITY_BIND_HOST: "0.0.0.0",
  IDENTITY_ORIGIN: STAGING.origin, IDENTITY_RP_ID: STAGING.rpId, IDENTITY_OIDC_CLIENT_ID: STAGING.clientId,
  IDENTITY_REDIRECT_URIS: JSON.stringify([STAGING.redirect]), IDENTITY_ALB_SUBNET_CIDRS: "10.0.0.0/24,10.0.1.0/24",
  IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify(credentials), IDENTITY_DATABASE_HOST: "synthetic.abc123.us-east-1.rds.amazonaws.com",
  BETTER_AUTH_SECRET: "b".repeat(64), IDENTITY_SESSION_STATUS_SECRET: "c".repeat(64), IDENTITY_DELIVERY_SEED: "d".repeat(64) };
test("ECS runtime accepts only staged runtime credentials and derives a separate delivery key", () => {
  const result = stagingContainerEnvironment(env), url = new URL(result.DATABASE_URL!);
  assert.equal(url.username, STAGING.runtimeRole); assert.equal(url.password, credentials.password);
  assert.equal(result.IDENTITY_DELIVERY_KEY!.length, 43); assert.notEqual(result.IDENTITY_DELIVERY_KEY, env.BETTER_AUTH_SECRET);
  assert.equal(result.IDENTITY_RUNTIME_CREDENTIALS, undefined); assert.equal(result.IDENTITY_DELIVERY_SEED, undefined);
});
test("container bootstrap rejects owner credentials, foreign database hosts and shared keys", () => {
  for (const delta of [{ IDENTITY_MODE: "production" }, { IDENTITY_OWNER_CREDENTIALS: "owner" }, { MIGRATION_DATABASE_URL: "secret" },
    { IDENTITY_DATABASE_HOST: "attacker.invalid" }, { IDENTITY_DATABASE_HOST: "synthetic.abc.us-west-2.rds.amazonaws.com" },
    { IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify({ ...credentials, username: "owner" }) },
    { IDENTITY_RUNTIME_CREDENTIALS: JSON.stringify({ ...credentials, password: "short" }) },
    { IDENTITY_DELIVERY_SEED: env.BETTER_AUTH_SECRET }]) assert.throws(() => stagingContainerEnvironment({ ...env, ...delta }));
});

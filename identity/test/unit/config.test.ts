import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, assertSyntheticDatabase, assertRuntimeEnvironment } from "../../src/core/config.js";
const valid = { IDENTITY_MODE:"synthetic", DATABASE_URL:"postgresql://runtime:synthetic@localhost:5432/mirror_identity_synthetic",
  BETTER_AUTH_SECRET:"0123456789abcdef".repeat(4) };
test("local defaults are fixed to localhost:3040",()=>{const c=loadConfig(valid);assert.equal(c.origin,"http://localhost:3040");assert.equal(c.bindHost,"127.0.0.1");assert.deepEqual(c.redirectUris,["http://localhost:3000/api/auth/callback"]);});
for (const override of [{IDENTITY_MODE:"production"},{IDENTITY_MODE:""},{IDENTITY_ORIGIN:"https://accounts.mirrorprogress.com"},
  {IDENTITY_ORIGIN:"http://evil.invalid:3040"},{BETTER_AUTH_SECRET:"replace_me"},{IDENTITY_BIND_HOST:"192.0.2.1"}]) {
  test(`configuration fails closed: ${Object.keys(override)[0]}`,()=>assert.throws(()=>loadConfig({...valid,...override})));
}
for (const url of ["postgresql://user:pw@production.invalid/mirror_identity_synthetic", "postgresql://user:pw@localhost/production",
  "postgresql://user:pw@127.0.0.1/customer_accounts", "https://localhost/mirror_identity_synthetic"]) {
  test(`rejects non-synthetic database ${url}`,()=>assert.throws(()=>assertSyntheticDatabase(url)));
}

test("runtime accepts only the runtime environment", () => assert.doesNotThrow(() => assertRuntimeEnvironment(valid)));
for (const key of ["MIGRATION_DATABASE_URL", "IDENTITY_RUNTIME_DB_PASSWORD", "POSTGRES_PASSWORD"]) {
  test(`runtime rejects operator credential ${key}`, () => assert.throws(() => assertRuntimeEnvironment({ ...valid, [key]: "synthetic-only" })));
}

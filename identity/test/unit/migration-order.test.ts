/**
 * Migration history guard. Production Identity (image mirror-identity-production@sha256:ae4e3834...) has
 * applied 001-007 and recorded each file's SHA-256 in mirror_schema_migration. The runners refuse to start
 * on a checksum mismatch, so these files must never change, and every runner must apply the same ordered
 * list. Reads files only; no database.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { LOCAL_PREVIEW_MIGRATIONS } from "../../scripts/local-preview-schema.js";

const EXPECTED = ["001-mirror-policy", "002-staging-enrollment", "003-assisted-recovery", "004-managed-invitations",
  "005-admin-invitation-authority", "006-trial-invitation-manager", "007-unified-prospect-invitations",
  "008-self-serve-trial-invitations"];
// SHA-256 of the files in the live production image; 008 is new in this release.
const APPLIED_IN_PRODUCTION: Record<string, string> = {
  "001-mirror-policy": "b6db51a3987b475e09c3e6987d6e6bb7b76670393d049d504b9350555a9384ea",
  "002-staging-enrollment": "8aaf072857134135e00b7b25f24dc214b8025b067c87c3601e8c4ab82b9e246d",
  "003-assisted-recovery": "0259692f8e4124be1436c446e19ba174840e2e09cdf27bbb7832632364254bd7",
  "004-managed-invitations": "65a4baebd6954fb9db0ded8a4a10e30d62cd0e466adcf2fd9d9168182356dc6b",
  "005-admin-invitation-authority": "2cf895b6daf3ea6c6fdae5d0e1b7a5cdc829da79c64bfa5eae74680048bb67da",
  "006-trial-invitation-manager": "9d6638b3642d62bb33cc85120a468947dce2196205222ee07d323d594b86c467",
  "007-unified-prospect-invitations": "0dba9bd3d120706a338e62260734f22ebe3a609c470a4be006b6c62f61cc8b66",
};
const runnerList = (file: string): string[] => {
  const match = /for \(const name of (\[[^\]]+\])\)/.exec(readFileSync(file, "utf8"));
  assert.ok(match, `${file} has no migration list`);
  return JSON.parse(match[1]!) as string[];
};

test("every runner applies 001-008 in order, and every migration file is listed", () => {
  assert.deepEqual(runnerList("scripts/migrate-production.ts"), EXPECTED);
  assert.deepEqual(runnerList("scripts/migrate-staging.ts"), EXPECTED);
  assert.deepEqual([...LOCAL_PREVIEW_MIGRATIONS], EXPECTED);
  const enrollment = readFileSync("test/staging/enrollment.test.ts", "utf8");
  assert.deepEqual([...enrollment.matchAll(/"(\d{3}-[a-z-]+)"/g)].map(m => m[1]), EXPECTED);
  assert.deepEqual(readdirSync("migrations").filter(f => f.endsWith(".sql")).sort(), EXPECTED.map(n => `${n}.sql`));
});

test("migrations already applied in production are byte-identical to the live image", () => {
  for (const [name, checksum] of Object.entries(APPLIED_IN_PRODUCTION)) {
    assert.equal(createHash("sha256").update(readFileSync(`migrations/${name}.sql`, "utf8")).digest("hex"), checksum, name);
  }
});

test("008 does not redefine any function 004-007 own, so 007's trial-manager resend survives it", () => {
  const defined = (name: string) => new Set([...readFileSync(`migrations/${name}.sql`, "utf8")
    .matchAll(/CREATE (?:OR REPLACE )?FUNCTION\s+(\w+)/g)].map(m => m[1]));
  const earlier = new Set(EXPECTED.slice(0, 7).flatMap(name => [...defined(name)]));
  assert.ok(earlier.has("mirror_managed_resend"));
  assert.deepEqual([...defined("008-self-serve-trial-invitations")].filter(f => earlier.has(f)), []);
});

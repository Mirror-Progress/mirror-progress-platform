/** Explicit first-resolution step. Never manufacture a lockfile or silently use a partial one. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
if (existsSync("package-lock.json")) throw new Error("A lock already exists. Review it and run npm ci instead.");
const outcome = spawnSync("npm", ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"], { stdio: "inherit" });
if (outcome.status !== 0) process.exit(outcome.status ?? 1);
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
for (const name of ["better-auth", "@better-auth/oauth-provider", "@better-auth/passkey"]) {
  if (lock.packages?.[`node_modules/${name}`]?.version !== "1.7.5") throw new Error(`Unexpected resolved version: ${name}`);
}
console.info("Resolved package-lock.json. Review and commit it before treating builds as reproducible.");

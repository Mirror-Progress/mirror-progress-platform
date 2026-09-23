import { writeFile, unlink } from "node:fs/promises";
import { Pool } from "pg";
import { productionDatabase } from "../src/core/production-config.js";
import { decimalEpoch } from "../src/core/staging-policy.js";
import { digest, opaqueToken } from "../src/core/tokens.js";

// Reconciler/issuer/approver is derived from the authenticated DB login, NOT a CLI actor argument.
async function main() {
  if (process.env.IDENTITY_MODE !== "production") throw new Error("Production only");
  const url = process.env.IDENTITY_OPERATOR_DATABASE_URL ?? "";
  productionDatabase(url, false);
  const [command, principal, epoch, review, extra, surplus] = process.argv.slice(2);
  if (!principal || principal.length > 256 || !review || review.trim().length < 8 || review.length > 200 || surplus ||
      !["reconcile", "issue", "approve"].includes(command ?? "")) throw new Error("Invalid operator command");
  decimalEpoch(epoch);
  if ((command === "approve" && extra) || (command !== "approve" && !extra)) throw new Error("Invalid command argument");
  const db = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true }, max: 1 });
  let createdFile: string | undefined;
  const connection = await db.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SET LOCAL ROLE mirror_identity_production_operator");
    if (command === "reconcile") {
      await connection.query("SELECT mirror_staging_reconcile($1,$2::bigint,$3,$4)", [principal, epoch, extra, review]);
    } else if (command === "approve") {
      await connection.query("SELECT mirror_staging_approve($1,$2::bigint,$3)", [principal, epoch, review]);
    } else {
      const token = opaqueToken();
      await connection.query("SELECT mirror_staging_issue($1,$2::bigint,$3,$4)", [principal, epoch, digest(token), review]);
      await writeFile(extra!, JSON.stringify({ invitation: token, expiresInSeconds: 900 }) + "\n", { flag: "wx", mode: 0o600 });
      createdFile = extra;
    }
    await connection.query("COMMIT");
    console.info("Production operator action audited. No message sent.");
  } catch (error) {
    await connection.query("ROLLBACK");
    if (createdFile) await unlink(createdFile).catch(() => {});
    throw error;
  } finally { connection.release(); await db.end(); }
}
try { await main(); } catch { console.error("Operator action rejected. No account was linked or activated."); process.exitCode = 1; }

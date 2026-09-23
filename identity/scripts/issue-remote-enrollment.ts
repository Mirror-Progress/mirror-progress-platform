import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { loadConfig } from "../src/core/config.js";
import { createPool } from "../src/db.js";
import { opaqueToken } from "../src/core/tokens.js";
import { REMOTE_ENROLL_EMAIL, remoteIssueKey } from "../src/core/remote-enrollment.js";

async function main() {
  const config = loadConfig();
  const issueMode = process.env.IDENTITY_REMOTE_ENROLL_ISSUE;
  if (config.mode !== "production" || !config.freshInstall ||
      !["check-owner-20260923", "owner-20260923"].includes(issueMode ?? "") ||
      process.env.IDENTITY_MAIL_DELIVERY !== "ses" ||
      process.env.IDENTITY_MAIL_FROM !== "identity@mirrorprogress.com") {
    throw new Error("Operator-issued production enrollment only");
  }
  const db = createPool(config);
  try {
    const { rows } = await db.query<{ id: string; email: string }>(`SELECT u.id,u.email
      FROM "user" u JOIN mirror_binding b ON b.user_id=u.id
      JOIN mirror_principal p ON p.id=b.principal_id
      WHERE lower(u.email)=$1 AND u."emailVerified"=true AND p.disabled=false AND p.privileged=true
        AND EXISTS(SELECT 1 FROM passkey k WHERE k."userId"=u.id)`, [REMOTE_ENROLL_EMAIL]);
    if (rows.length !== 1) throw new Error("Owner account is not eligible for remote enrollment");
    if (issueMode === "check-owner-20260923") {
      console.info("Existing owner account is eligible for one-time phone enrollment.");
      return;
    }
    const token = opaqueToken();
    const key = remoteIssueKey(rows[0]!.id, token)!;
    await db.query(`INSERT INTO mirror_rate_limit(key,window_start,count) VALUES ($1,$2,1)`, [key, Date.now()]);
    const url = `${config.origin}/#remoteEnroll=${token}`;
    const mail = new SESv2Client({ region: "us-east-1", maxAttempts: 2 });
    try {
      await mail.send(new SendEmailCommand({
        FromEmailAddress: process.env.IDENTITY_MAIL_FROM,
        Destination: { ToAddresses: [REMOTE_ENROLL_EMAIL] },
        Content: { Simple: {
          Subject: { Data: "Set up Prospect on your phone", Charset: "UTF-8" },
          Body: { Text: { Data: `Open this one-time link on your phone within 15 minutes:\n${url}\n\nSign in with your existing password, then create a passkey on your phone. The link only permits one passkey registration; it does not sign in to Prospect by itself.`, Charset: "UTF-8" },
            Html: { Data: `<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;color:#253d33"><p style="letter-spacing:.18em;font-size:12px">MIRROR PROGRESS</p><h1 style="font-size:28px">Prospect on your phone</h1><p>Open this one-time link on your phone within 15 minutes. Sign in with your existing password, then create a passkey on your phone.</p><p><a href="${url}" style="display:inline-block;background:#244a37;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px">Set up phone passkey</a></p><p style="font-size:13px;color:#65756b">The link only permits one passkey registration and cannot sign in by itself.</p></div>`, Charset: "UTF-8" } },
        } },
      }));
    } catch (error) {
      await db.query("DELETE FROM mirror_rate_limit WHERE key=$1 AND count=1", [key]);
      throw error;
    } finally { mail.destroy(); }
    console.info("One-time phone enrollment link sent to the existing owner mailbox.");
  } finally { await db.end(); }
}

try { await main(); }
catch { console.error("One-time phone enrollment delivery failed. No link or secret was logged."); process.exitCode = 1; }

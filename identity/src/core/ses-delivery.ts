import { SESv2Client, SendEmailCommand, GetAccountCommand } from '@aws-sdk/client-sesv2';
import type { EnrollmentMessage, EnrollmentTransport } from './delivery.js';
import { invitationEmail } from './invitation-email.js';
const accountClient = new SESv2Client({ region: 'us-east-1', maxAttempts: 1 });
let productionAccess: { enabled: boolean; checkedAt: number } | null = null;
export async function invitationRecipientDeliverable(email: string): Promise<boolean> {
  if (email.toLowerCase().endsWith('@mirrorprogress.com')) return true;
  if (productionAccess && Date.now() - productionAccess.checkedAt < 300_000) return productionAccess.enabled;
  const account = await accountClient.send(new GetAccountCommand({}), { abortSignal: AbortSignal.timeout(3000) });
  productionAccess = { enabled: account.ProductionAccessEnabled === true, checkedAt: Date.now() };
  return productionAccess.enabled;
}
export function passwordResetEmail(message: { to: string; name: string; url: string }) {
  const link = new URL(message.url);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to) ||
      link.origin !== 'https://accounts.mirrorprogress.com' || link.pathname !== '/' || link.search ||
      !/^#reset=[A-Za-z0-9_-]{24,128}$/.test(link.hash)) throw new Error('invalid_password_reset_message');
  const firstName = message.name.trim().split(/\s+/)[0] ?? '';
  const safeName = firstName.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
  const safeUrl = message.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const text = `Hi ${firstName || 'there'},\n\nUse this one-time link to reset your Mirror Progress Prospect password:\n\n${message.url}\n\nThe link expires in one hour. If you did not request this, you can ignore this email. Your passkey remains required to sign in.\n\nMirror Progress`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0b1014;color:#f4f5f4;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#b9c9c5">Mirror Progress</p><h1 style="font-size:30px;line-height:1.2;font-weight:500;margin:32px 0 16px">Reset your Prospect password</h1><p style="font-size:16px;line-height:1.6">Hi ${safeName || 'there'},</p><p style="font-size:16px;line-height:1.6">Use this one-time link to choose a new password.</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;background:#c7f36d;color:#102017;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:700">Reset password</a></p><p style="font-size:13px;line-height:1.5;color:#b9c9c5">This link expires in one hour. If you did not request it, ignore this email. Your passkey remains required to sign in.</p></div></body></html>`;
  return { subject: 'Reset your Mirror Progress Prospect password', text, html };
}
export async function sendPasswordResetEmail(message: { to: string; name: string; url: string },
  client: Pick<SESv2Client, 'send'> = accountClient): Promise<void> {
  const content = passwordResetEmail(message);
  await client.send(new SendEmailCommand({
    FromEmailAddress: 'hello@mirrorprogress.com', Destination: { ToAddresses: [message.to] },
    Content: { Simple: { Subject: { Data: content.subject, Charset: 'UTF-8' },
      Body: { Text: { Data: content.text, Charset: 'UTF-8' }, Html: { Data: content.html, Charset: 'UTF-8' } } } },
  }), { abortSignal: AbortSignal.timeout(10000) });
}
/** Durable outbox serializes sends; accepted IDs are additionally deduplicated in this process.
 * SES has no idempotency key: a crash after acceptance can duplicate the same expiring message.
 * Neither send acceptance nor a duplicate message supplies mailbox possession evidence. */
export class SesEnrollmentTransport implements EnrollmentTransport {
  private readonly accepted = new Set<string>();
  constructor(private readonly client = new SESv2Client({ region: 'us-east-1', maxAttempts: 1 })) {}
  async send(message: EnrollmentMessage): Promise<void> {
    if (this.accepted.has(message.idempotencyKey)) return;
    const url = new URL(message.url);
    const managed = url.hash.startsWith('#invitation=');
    const allowedEmail = managed
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to)
      : /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@mirrorprogress\.com$/.test(message.to);
    if (!allowedEmail ||
        url.origin !== 'https://accounts.mirrorprogress.com' || url.pathname !== '/' || url.search ||
        !/^#(?:mailboxToken|invitation)=[A-Za-z0-9_-]{43}$/.test(url.hash) || message.expiresAt.getTime() <= Date.now()) throw new Error('invalid_enrollment_message');
    const branded = managed
      ? invitationEmail({ to: message.to, name: message.inviteeName ?? '', company: message.company ?? '', url: message.url, expiresAt: message.expiresAt })
      : null;
    await this.client.send(new SendEmailCommand({
      FromEmailAddress: 'hello@mirrorprogress.com', Destination: { ToAddresses: [message.to] },
      Content: { Simple: { Subject: { Data: branded?.subject ?? 'Set up your Mirror Progress account', Charset: 'UTF-8' },
        Body: { Text: { Data: branded?.text ?? `Open this link to verify your email and finish setting up your Mirror Progress account:\n\n${message.url}\n\nUse the invitation provided with your account setup. This link expires in 10 minutes or sooner. If you did not request this, ignore this message.`, Charset: 'UTF-8' },
          ...(branded ? { Html: { Data: branded.html, Charset: 'UTF-8' } } : {}) } } },
    }), { abortSignal: AbortSignal.timeout(10000) });
    this.accepted.add(message.idempotencyKey);
    if (this.accepted.size > 1000) this.accepted.delete(this.accepted.values().next().value!);
  }
  close(): void { this.client.destroy(); }
}

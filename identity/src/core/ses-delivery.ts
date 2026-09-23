import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { EnrollmentMessage, EnrollmentTransport } from './delivery.js';
/** Durable outbox serializes sends; accepted IDs are additionally deduplicated in this process.
 * SES has no idempotency key: a crash after acceptance can duplicate the same expiring message.
 * Neither send acceptance nor a duplicate message supplies mailbox possession evidence. */
export class SesEnrollmentTransport implements EnrollmentTransport {
  private readonly accepted = new Set<string>();
  constructor(private readonly client = new SESv2Client({ region: 'us-east-1', maxAttempts: 1 })) {}
  async send(message: EnrollmentMessage): Promise<void> {
    if (this.accepted.has(message.idempotencyKey)) return;
    const url = new URL(message.url);
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@mirrorprogress\.com$/.test(message.to) ||
        url.origin !== 'https://accounts.mirrorprogress.com' || url.pathname !== '/' || url.search ||
        !/^#mailboxToken=[A-Za-z0-9_-]{43}$/.test(url.hash) || message.expiresAt.getTime() <= Date.now()) throw new Error('invalid_enrollment_message');
    await this.client.send(new SendEmailCommand({
      FromEmailAddress: 'identity@mirrorprogress.com', Destination: { ToAddresses: [message.to] },
      Content: { Simple: { Subject: { Data: 'Set up your Mirror Progress account', Charset: 'UTF-8' },
        Body: { Text: { Data: `Open this link to verify your email and finish setting up your Mirror Progress account:\n\n${message.url}\n\nUse the invitation provided with your account setup. This link expires in 10 minutes or sooner. If you did not request this, ignore this message.`, Charset: 'UTF-8' } } } },
    }), { abortSignal: AbortSignal.timeout(10000) });
    this.accepted.add(message.idempotencyKey);
    if (this.accepted.size > 1000) this.accepted.delete(this.accepted.values().next().value!);
  }
  close(): void { this.client.destroy(); }
}

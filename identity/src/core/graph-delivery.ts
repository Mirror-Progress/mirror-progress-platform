import type { EnrollmentMessage, EnrollmentTransport } from './delivery.js';
import { invitationEmail } from './invitation-email.js';
import { passwordResetEmail } from './ses-delivery.js';

const sender = 'hello@mirrorprogress.com';
type Fetch = typeof fetch;

export class GraphEnrollmentTransport implements EnrollmentTransport {
  private token: { value: string; expiresAt: number } | undefined;
  private readonly accepted = new Set<string>();
  constructor(private readonly tenantId: string, private readonly clientId: string,
    private readonly clientSecret: string, private readonly request: Fetch = fetch) {
    if (!/^[a-f\d-]{36}$/i.test(tenantId) || !/^[a-f\d-]{36}$/i.test(clientId) || !clientSecret) {
      throw new Error('invalid_graph_mail_configuration');
    }
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const response = await this.request(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret,
        scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`graph_mail_token_failed:${response.status}`);
    const body = await response.json() as { access_token?: string; expires_in?: number };
    if (!body.access_token || !Number.isFinite(body.expires_in) || (body.expires_in ?? 0) <= 0) {
      throw new Error('graph_mail_token_invalid');
    }
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in! * 1000 };
    return this.token.value;
  }

  async send(message: EnrollmentMessage): Promise<void> {
    if (this.accepted.has(message.idempotencyKey)) return;
    const url = new URL(message.url);
    const managed = url.hash.startsWith('#invitation=');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to) ||
        (!managed && !message.to.toLowerCase().endsWith('@mirrorprogress.com')) ||
        url.origin !== 'https://accounts.mirrorprogress.com' || url.pathname !== '/' || url.search ||
        !/^#(?:mailboxToken|invitation)=[A-Za-z0-9_-]{43}$/.test(url.hash) ||
        message.expiresAt.getTime() <= Date.now()) throw new Error('invalid_enrollment_message');
    const branded = managed ? invitationEmail({ to: message.to, name: message.inviteeName ?? '',
      company: message.company ?? '', url: message.url, expiresAt: message.expiresAt }) : null;
    const content = branded ?? { subject: 'Set up your Mirror Progress account',
      text: `Open this link to verify your email and finish setting up your Mirror Progress account:\n\n${message.url}\n\nThis link expires in 10 minutes or sooner. If you did not request it, ignore this message.`,
      html: undefined };
    const token = await this.accessToken();
    const response = await this.request(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { subject: content.subject,
        body: { contentType: content.html ? 'HTML' : 'Text', content: content.html ?? content.text },
        toRecipients: [{ emailAddress: { address: message.to } }] }, saveToSentItems: true }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 202) throw new Error(`graph_mail_send_failed:${response.status}`);
    this.accepted.add(message.idempotencyKey);
    if (this.accepted.size > 1000) this.accepted.delete(this.accepted.values().next().value!);
  }

  async sendPasswordResetEmail(message: { to: string; name: string; url: string }): Promise<void> {
    const content = passwordResetEmail(message);
    const token = await this.accessToken();
    const response = await this.request(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { subject: content.subject,
        body: { contentType: 'HTML', content: content.html },
        toRecipients: [{ emailAddress: { address: message.to } }] }, saveToSentItems: true }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 202) throw new Error(`graph_mail_send_failed:${response.status}`);
  }

  async ready(): Promise<boolean> {
    try { await this.accessToken(); return true; } catch { return false; }
  }
  close(): void { this.token = undefined; }
}

export function graphMailFromEnvironment(): GraphEnrollmentTransport | undefined {
  if (process.env.IDENTITY_MAIL_DELIVERY !== 'graph') return undefined;
  return new GraphEnrollmentTransport(process.env.IDENTITY_GRAPH_TENANT_ID ?? '',
    process.env.IDENTITY_GRAPH_CLIENT_ID ?? '', process.env.IDENTITY_GRAPH_CLIENT_SECRET ?? '');
}

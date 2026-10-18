export type InvitationKind = 'standard' | 'self_serve_trial';

/**
 * Trial length shown in a self-serve invitation when the platform did not send `trialDays`.
 * Prospect owns the real term (PROSPECT_SELF_SERVE_TRIAL_DAYS, default 14); the platform passes
 * its value with the request and Identity stores it with the invitation (migration 008).
 */
export const DEFAULT_SELF_SERVE_TRIAL_DAYS = 14;

export interface InvitationEmail {
  to: string;
  name: string;
  company: string;
  url: string;
  expiresAt: Date;
  /** Selects the copy; omitted means the standard invitation. */
  kind?: InvitationKind;
  /** Self-serve trial length in days (1-365); defaults to DEFAULT_SELF_SERVE_TRIAL_DAYS. */
  trialDays?: number;
}

const PRODUCTION_ORIGIN = 'https://accounts.mirrorprogress.com';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

const shell = (heading: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0b1014;color:#f4f5f4;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#b9c9c5">Mirror Progress</p><h1 style="font-size:30px;line-height:1.2;font-weight:500;margin:32px 0 16px">${heading}</h1>${body}<hr style="border:0;border-top:1px solid #33413d;margin:36px 0"><p style="font-size:12px;color:#b9c9c5">Mirror Progress Prospect</p></div></body></html>`;
const paragraph = (value: string) => `<p style="font-size:16px;line-height:1.6">${value}</p>`;
const button = (url: string, label: string) => `<p style="margin:32px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#c7f36d;color:#102017;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:700">${label}</a></p>`;
const smallPrint = (value: string) => `<p style="font-size:13px;line-height:1.5;color:#b9c9c5">${value}</p>`;

/**
 * Branded invitation. `options.origin` exists only so the local preview can render the same
 * message for a loopback link; every real transport uses the production default.
 */
export function invitationEmail(message: InvitationEmail, options: { origin?: string } = {}) {
  const link = new URL(message.url);
  if (link.origin !== (options.origin ?? PRODUCTION_ORIGIN) || link.pathname !== '/' || link.search ||
      !/^#invitation=[A-Za-z0-9_-]{43}$/.test(link.hash) || !Number.isFinite(message.expiresAt.getTime()) ||
      message.expiresAt.getTime() <= Date.now()) throw new Error('invalid_invitation_email');
  const firstName = message.name.trim().split(/\s+/)[0] ?? '';
  if (!firstName || firstName.length > 120 || !message.company.trim() || message.company.length > 120) {
    throw new Error('invalid_invitation_email');
  }
  const expiry = message.expiresAt.toUTCString();
  if (message.kind === 'self_serve_trial') {
    const days = message.trialDays ?? DEFAULT_SELF_SERVE_TRIAL_DAYS;
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('invalid_invitation_email');
    const subject = `Start your ${days}-day Prospect trial`;
    const text = `Hi ${firstName},\n\nYour ${days}-day Mirror Progress Prospect trial for ${message.company} is ready.\n\nThe trial starts when you first sign in and lasts ${days} days. No card is required.\n\nStart your trial: ${message.url}\n\nThis link can be used once and expires ${expiry}.\n\nIf you didn't request this, ignore this email.\n\nMirror Progress`;
    const html = shell(`Start your ${days}-day Prospect trial`,
      paragraph(`Hi ${escapeHtml(firstName)},`) +
      paragraph(`Your ${days}-day Mirror Progress Prospect trial for <strong>${escapeHtml(message.company)}</strong> is ready.`) +
      paragraph(`The trial starts when you first sign in and lasts ${days} days. No card is required.`) +
      button(message.url, 'Start your trial') +
      smallPrint(`This link works once and expires ${escapeHtml(expiry)}.`) +
      smallPrint(`If you didn't request this, ignore this email.`));
    return { subject, text, html };
  }
  const subject = `You're invited to Mirror Progress Prospect`;
  const text = `Hi ${firstName},\n\nYou've been invited to Mirror Progress Prospect for ${message.company}.\n\nCreate your account: ${message.url}\n\nThis link can be used once and expires ${expiry}. If you weren't expecting this invitation, you can ignore this email.\n\nMirror Progress`;
  const html = shell(`You're invited to Prospect`,
    paragraph(`Hi ${escapeHtml(firstName)},`) +
    paragraph(`You've been invited to use Mirror Progress Prospect for ${escapeHtml(message.company)}.`) +
    button(message.url, 'Create your account') +
    smallPrint(`This link works once and expires ${escapeHtml(expiry)}. If you weren't expecting this invitation, ignore this email.`));
  return { subject, text, html };
}

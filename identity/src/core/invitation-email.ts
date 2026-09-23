export interface InvitationEmail {
  to: string;
  name: string;
  company: string;
  url: string;
  expiresAt: Date;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

export function invitationEmail(message: InvitationEmail) {
  const link = new URL(message.url);
  if (link.origin !== 'https://accounts.mirrorprogress.com' || link.pathname !== '/' || link.search ||
      !/^#invitation=[A-Za-z0-9_-]{43}$/.test(link.hash) || !Number.isFinite(message.expiresAt.getTime()) ||
      message.expiresAt.getTime() <= Date.now()) throw new Error('invalid_invitation_email');
  const firstName = message.name.trim().split(/\s+/)[0] ?? '';
  if (!firstName || firstName.length > 120 || !message.company.trim() || message.company.length > 120) {
    throw new Error('invalid_invitation_email');
  }
  const subject = `You're invited to Mirror Progress Prospect`;
  const expiry = message.expiresAt.toUTCString();
  const text = `Hi ${firstName},\n\nYou've been invited to Mirror Progress Prospect for ${message.company}.\n\nCreate your account: ${message.url}\n\nThis link can be used once and expires ${expiry}. If you weren't expecting this invitation, you can ignore this email.\n\nMirror Progress`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0b1014;color:#f4f5f4;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#b9c9c5">Mirror Progress</p><h1 style="font-size:30px;line-height:1.2;font-weight:500;margin:32px 0 16px">You're invited to Prospect</h1><p style="font-size:16px;line-height:1.6">Hi ${escapeHtml(firstName)},</p><p style="font-size:16px;line-height:1.6">You've been invited to use Mirror Progress Prospect for ${escapeHtml(message.company)}.</p><p style="margin:32px 0"><a href="${escapeHtml(message.url)}" style="display:inline-block;background:#c7f36d;color:#102017;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:700">Create your account</a></p><p style="font-size:13px;line-height:1.5;color:#b9c9c5">This link works once and expires ${escapeHtml(expiry)}. If you weren't expecting this invitation, ignore this email.</p><hr style="border:0;border-top:1px solid #33413d;margin:36px 0"><p style="font-size:12px;color:#b9c9c5">Mirror Progress Prospect</p></div></body></html>`;
  return { subject, text, html };
}

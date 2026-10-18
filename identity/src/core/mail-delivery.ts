import type { EnrollmentTransport } from './delivery.js';
import { GraphEnrollmentTransport, graphMailFromEnvironment } from './graph-delivery.js';
import { localPreviewTransport } from './local-preview.js';
import { invitationRecipientDeliverable as sesRecipientDeliverable, sendPasswordResetEmail as sendSesPasswordResetEmail, SesEnrollmentTransport } from './ses-delivery.js';

let graph: GraphEnrollmentTransport | undefined;
export function enrollmentTransport(): EnrollmentTransport | undefined {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') return graph ??= graphMailFromEnvironment();
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return new SesEnrollmentTransport();
  // Local preview capture only; undefined (and therefore a startup failure) anywhere else.
  if (process.env.IDENTITY_MAIL_DELIVERY === 'local-file') return localPreviewTransport();
  return undefined;
}

export async function invitationRecipientDeliverable(email: string): Promise<boolean> {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') return process.env.IDENTITY_GRAPH_DELIVERY_VERIFIED === '1' &&
    await (graph ??= graphMailFromEnvironment())!.ready();
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return sesRecipientDeliverable(email);
  if (process.env.IDENTITY_MAIL_DELIVERY === 'local-file') return localPreviewTransport() !== undefined;
  return false;
}

export async function sendPasswordResetEmail(message: { to: string; name: string; url: string }): Promise<void> {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') {
    const transport = graph ??= graphMailFromEnvironment();
    if (!transport) throw new Error('graph_mail_not_configured');
    return transport.sendPasswordResetEmail(message);
  }
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return sendSesPasswordResetEmail(message);
  const local = process.env.IDENTITY_MAIL_DELIVERY === 'local-file' ? localPreviewTransport() : undefined;
  if (local) return local.capture({ kind: 'password_reset', to: message.to, url: message.url, name: message.name });
  throw new Error('mail_delivery_not_configured');
}

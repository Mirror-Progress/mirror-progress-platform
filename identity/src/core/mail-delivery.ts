import type { EnrollmentTransport } from './delivery.js';
import { GraphEnrollmentTransport, graphMailFromEnvironment } from './graph-delivery.js';
import { invitationRecipientDeliverable as sesRecipientDeliverable, sendPasswordResetEmail as sendSesPasswordResetEmail, SesEnrollmentTransport } from './ses-delivery.js';

let graph: GraphEnrollmentTransport | undefined;
export function enrollmentTransport(): EnrollmentTransport | undefined {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') return graph ??= graphMailFromEnvironment();
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return new SesEnrollmentTransport();
  return undefined;
}

export async function invitationRecipientDeliverable(email: string): Promise<boolean> {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') return process.env.IDENTITY_GRAPH_DELIVERY_VERIFIED === '1' &&
    await (graph ??= graphMailFromEnvironment())!.ready();
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return sesRecipientDeliverable(email);
  return false;
}

export async function sendPasswordResetEmail(message: { to: string; name: string; url: string }): Promise<void> {
  if (process.env.IDENTITY_MAIL_DELIVERY === 'graph') {
    const transport = graph ??= graphMailFromEnvironment();
    if (!transport) throw new Error('graph_mail_not_configured');
    return transport.sendPasswordResetEmail(message);
  }
  if (process.env.IDENTITY_MAIL_DELIVERY === 'ses') return sendSesPasswordResetEmail(message);
  throw new Error('mail_delivery_not_configured');
}

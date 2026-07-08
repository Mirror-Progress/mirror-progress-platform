import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import {
  createInboundLead,
  updateInboundLeadEmailNotification,
  type InboundLeadEmailNotification,
} from '../../lib/inbound-leads';

function getSmtpConfig() {
  const host = `${process.env.SMTP_HOST ?? ''}`.trim();
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = `${process.env.SMTP_USER ?? ''}`.trim();
  const pass = `${process.env.SMTP_APP_PASSWORD ?? ''}`.trim();
  const fromEmail = `${process.env.SMTP_FROM_EMAIL ?? user}`.trim();
  const toEmail = `${process.env.SMTP_TO_EMAIL ?? fromEmail}`.trim();

  if (!host || !port || !user || !pass || !fromEmail || !toEmail) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    fromEmail,
    toEmail,
  };
}

function escapeHtml(value: unknown) {
  return `${value ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let lead: Awaited<ReturnType<typeof createInboundLead>>;

  try {
    lead = await createInboundLead(req.body);
  } catch (error) {
    return res.status(400).json({
      success: false,
      emailNotification: 'not_configured',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to capture inbound lead.',
    });
  }

  const config = getSmtpConfig();

  if (!config) {
    return res.status(200).json({
      success: true,
      leadId: lead.id,
      emailNotification: 'not_configured' satisfies InboundLeadEmailNotification,
      message: 'Lead captured. Email delivery is not configured for this environment.',
    });
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const mailOptions = {
    from: config.fromEmail,
    replyTo: lead.companyEmail,
    to: config.toEmail,
    subject: `New Mirror Progress Lead: ${lead.companyName || lead.companyEmail}`,
    html: `
      <h1>New Mirror Progress Lead</h1>
      <p><strong>Name:</strong> ${escapeHtml([lead.firstName, lead.lastName].filter(Boolean).join(' '))}</p>
      <p><strong>Company:</strong> ${escapeHtml(lead.companyName)}</p>
      <p><strong>Company email:</strong> ${escapeHtml(lead.companyEmail)}</p>
      <p><strong>Company size:</strong> ${escapeHtml(lead.companySize)}</p>
      <p><strong>Industry:</strong> ${escapeHtml(lead.industry)}</p>
      <p><strong>How they heard about us:</strong> ${escapeHtml(lead.howDidYouHearAboutUs)}</p>
      <p><strong>Message:</strong><br/> ${escapeHtml(lead.message).replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p><strong>Landing path:</strong> ${escapeHtml(lead.attribution.landingPath)}</p>
      <p><strong>Referrer:</strong> ${escapeHtml(lead.attribution.referrer)}</p>
      <p><strong>UTM source:</strong> ${escapeHtml(lead.attribution.utmSource)}</p>
      <p><strong>UTM medium:</strong> ${escapeHtml(lead.attribution.utmMedium)}</p>
      <p><strong>UTM campaign:</strong> ${escapeHtml(lead.attribution.utmCampaign)}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    await updateInboundLeadEmailNotification(lead.id, 'sent');
    res.status(200).json({
      success: true,
      leadId: lead.id,
      emailNotification: 'sent',
      message: 'Lead captured and email notification sent.',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    const warning = error instanceof Error ? error.message : 'Failed to send email.';
    await updateInboundLeadEmailNotification(lead.id, 'failed', warning);
    res.status(200).json({
      success: true,
      leadId: lead.id,
      emailNotification: 'failed',
      message: 'Lead captured, but email notification failed.',
    });
  }
}

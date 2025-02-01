// pages/api/sendMail.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, message, office } = req.body;

  // Configure the Nodemailer transporter using Gmail's SMTP server.
  // These credentials are only available on the server.
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'hello@mirrorprogress.com', // your company email
      pass: 'zkuc fuwh nbuq aitl',        // your Google app password
    },
  });

  const mailOptions = {
    from: email, // the sender's email from the form
    to: 'hello@mirrorprogress.com',
    subject: 'New Form Submission',
    html: `
      <h1>New Form Submission</h1>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Office:</strong> ${office.text}</p>
      <p><strong>Message:</strong><br/> ${message.replace(/\n/g, '<br/>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/api-errors';
import { allowPasswordReset, shouldExposeLocalResetLinks } from '../../../lib/app-runtime';
import { createPasswordResetRequest } from '../../../lib/password-resets';
import { applyRateLimit } from '../../../lib/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!allowPasswordReset()) {
    return res.status(403).json({
      error: 'Password reset is disabled for this deployment.',
    });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'auth-forgot-password',
      windowMs: 1000 * 60 * 30,
      max: 5,
      message: 'Too many password reset requests. Please wait and try again.',
    })
  ) {
    return;
  }

  const email = `${req.body?.email ?? ''}`.trim();

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const reset = await createPasswordResetRequest(email);
    const canShowResetLink = shouldExposeLocalResetLinks();

    return res.status(200).json({
      ok: true,
      message: canShowResetLink
        ? 'If an account exists for that email, a demo reset link is now available below.'
        : 'If an account exists for that email, the request has been recorded for follow-up.',
      resetUrl: canShowResetLink ? reset?.resetPath ?? null : null,
      expiresAt: canShowResetLink ? reset?.expiresAt ?? null : null,
      devOnly: canShowResetLink,
    });
  } catch (error) {
    return res.status(getApiErrorStatus(error, 500)).json({
      error: getApiErrorMessage(error, 'Unable to start password reset.'),
    });
  }
}

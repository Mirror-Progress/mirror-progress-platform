import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/api-errors';
import { allowPasswordReset } from '../../../lib/app-runtime';
import {
  consumePasswordResetToken,
  validatePasswordResetToken,
} from '../../../lib/password-resets';
import { applyRateLimit } from '../../../lib/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!allowPasswordReset()) {
    return res.status(403).json({
      error: 'Password reset is disabled for this deployment.',
    });
  }

  if (req.method === 'GET') {
    const token = `${req.query.token ?? ''}`.trim();

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    try {
      const reset = await validatePasswordResetToken(token);

      if (!reset) {
        return res
          .status(404)
          .json({ valid: false, error: 'This password reset link is invalid or has expired.' });
      }

      return res.status(200).json({
        valid: true,
        email: reset.email,
        expiresAt: reset.expiresAt,
      });
    } catch (error) {
      return res.status(getApiErrorStatus(error, 500)).json({
        valid: false,
        error: getApiErrorMessage(
          error,
          'Unable to validate this password reset link.'
        ),
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'auth-reset-password',
      windowMs: 1000 * 60 * 30,
      max: 5,
      message: 'Too many password reset attempts. Please wait and try again.',
    })
  ) {
    return;
  }

  const token = `${req.body?.token ?? ''}`.trim();
  const password = `${req.body?.password ?? ''}`;

  if (!token || !password) {
    return res
      .status(400)
      .json({ error: 'Reset token and password are required.' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    await consumePasswordResetToken(token, password);
    return res.status(200).json({
      ok: true,
      message: 'Your password has been updated. You can now log in.',
    });
  } catch (error) {
    return res.status(getApiErrorStatus(error)).json({
      error: getApiErrorMessage(
        error,
        'Unable to reset password with this link.'
      ),
    });
  }
}

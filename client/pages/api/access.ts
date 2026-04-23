import type { NextApiRequest, NextApiResponse } from 'next';
import {
  clearAppAccessCookie,
  createAppAccessToken,
  setAppAccessCookie,
} from '../../lib/access-cookie';
import { getAppAccessPassword, isProtectedMode } from '../../lib/app-runtime';
import { applyRateLimit } from '../../lib/rate-limit';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isProtectedMode()) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (req.method === 'DELETE') {
    clearAppAccessCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'app-access',
      windowMs: 1000 * 60 * 10,
      max: 10,
      message: 'Too many access attempts. Please wait and try again.',
    })
  ) {
    return;
  }

  const configuredPassword = getAppAccessPassword();

  if (!configuredPassword) {
    return res.status(503).json({
      error: 'Protected mode is enabled, but APP_ACCESS_PASSWORD is not configured.',
    });
  }

  const password = `${req.body?.password ?? ''}`;

  if (!password || createAppAccessToken(password) !== createAppAccessToken(configuredPassword)) {
    return res.status(401).json({ error: 'Incorrect access password.' });
  }

  setAppAccessCookie(res, configuredPassword);
  return res.status(200).json({ ok: true });
}

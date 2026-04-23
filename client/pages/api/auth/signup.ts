import type { NextApiRequest, NextApiResponse } from 'next';
import { createAccount, toSessionUser } from '../../../lib/accounts';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/api-errors';
import { allowPublicSignup } from '../../../lib/app-runtime';
import { applyRateLimit } from '../../../lib/rate-limit';
import { setSessionCookie } from '../../../lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!allowPublicSignup()) {
    return res.status(403).json({
      error: 'Public signup is disabled for this deployment. Ask Mirror Progress to create your account.',
    });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'auth-signup',
      windowMs: 1000 * 60 * 30,
      max: 5,
      message: 'Too many signup attempts. Please wait and try again.',
    })
  ) {
    return;
  }

  const name = `${req.body?.name ?? ''}`.trim();
  const email = `${req.body?.email ?? ''}`.trim();
  const company = `${req.body?.company ?? ''}`.trim();
  const password = `${req.body?.password ?? ''}`;

  if (!name || !email || !company || !password) {
    return res
      .status(400)
      .json({ error: 'Name, email, company, and password are required.' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const account = await createAccount({ name, email, company, password });
    const user = toSessionUser(account);
    setSessionCookie(res, user);
    return res.status(201).json({ user });
  } catch (error) {
    return res.status(getApiErrorStatus(error)).json({
      error: getApiErrorMessage(error, 'Unable to create account.'),
    });
  }
}

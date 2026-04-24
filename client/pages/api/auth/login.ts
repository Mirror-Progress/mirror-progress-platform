import type { NextApiRequest, NextApiResponse } from 'next';
import {
  findAccountByEmail,
  toSessionUser,
  touchAccountLogin,
  verifyPassword,
} from '../../../lib/accounts';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/api-errors';
import { applyRateLimit } from '../../../lib/rate-limit';
import { setSessionCookie } from '../../../lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (
    !applyRateLimit(req, res, {
      bucket: 'auth-login',
      windowMs: 1000 * 60 * 10,
      max: 10,
      message: 'Too many login attempts. Please wait and try again.',
    })
  ) {
    return;
  }

  const email = `${req.body?.email ?? ''}`.trim();
  const password = `${req.body?.password ?? ''}`;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const account = await findAccountByEmail(email);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (account.status === 'disabled') {
      return res.status(403).json({ error: 'This account is currently disabled.' });
    }

    let sessionAccount = account;

    try {
      sessionAccount = await touchAccountLogin(account.id);
    } catch (error) {
      // Session creation can continue even if last-login tracking fails.
    }

    const user = toSessionUser(sessionAccount);
    setSessionCookie(res, user);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(getApiErrorStatus(error, 500)).json({
      error: getApiErrorMessage(error, 'Unable to log in right now.'),
    });
  }
}

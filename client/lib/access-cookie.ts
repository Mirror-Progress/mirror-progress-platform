import crypto from 'crypto';
import type { NextApiResponse } from 'next';

export const APP_ACCESS_COOKIE = 'mirror_progress_access';

function serializeCookie(token: string, maxAge: number) {
  const parts = [
    `${APP_ACCESS_COOKIE}=${token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function createAppAccessToken(password: string) {
  return crypto
    .createHash('sha256')
    .update(`mirror-progress-access:${password}`)
    .digest('hex');
}

export function setAppAccessCookie(res: NextApiResponse, password: string) {
  res.setHeader('Set-Cookie', serializeCookie(createAppAccessToken(password), 60 * 60 * 24 * 7));
}

export function clearAppAccessCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', serializeCookie('', 0));
}

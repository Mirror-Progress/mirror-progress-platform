import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiErrorMessage } from '../../../lib/api-errors';
import { getSessionUserFromRequest } from '../../../lib/session';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const user = getSessionUserFromRequest(req);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      error: getApiErrorMessage(error, 'Unable to read session state.'),
      user: null,
    });
  }
}

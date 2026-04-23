import type { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  bucket: string;
  windowMs: number;
  max: number;
  message: string;
}

const globalStore = globalThis as typeof globalThis & {
  __mirrorProgressRateLimitStore?: Map<string, RateLimitBucket>;
};

const rateLimitStore =
  globalStore.__mirrorProgressRateLimitStore ??
  new Map<string, RateLimitBucket>();

globalStore.__mirrorProgressRateLimitStore = rateLimitStore;

function getRequestIdentifier(req: NextApiRequest) {
  const forwarded = `${req.headers['x-forwarded-for'] ?? ''}`
    .split(',')
    .map((value) => value.trim())
    .find(Boolean);

  return forwarded || req.socket.remoteAddress || 'unknown';
}

export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
) {
  const now = Date.now();
  const key = `${options.bucket}:${getRequestIdentifier(req)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return true;
  }

  if (current.count >= options.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    res.setHeader('Retry-After', `${retryAfterSeconds}`);
    res.status(429).json({ error: options.message });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return true;
}

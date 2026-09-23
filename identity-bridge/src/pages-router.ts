import { fail } from './errors.js';
import type { CookieResponse } from './types.js';

/** Structural subset of NextApiResponse/Node ServerResponse; no Next.js dependency. */
export interface PagesHeaderResponse {
  getHeader(name: string): number | string | string[] | undefined;
  setHeader(name: string, value: number | string | readonly string[]): unknown;
}

export function pagesCookieResponse(response: PagesHeaderResponse): CookieResponse {
  try {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Referrer-Policy', 'no-referrer');
  } catch { fail('dependency_unavailable'); }
  return Object.freeze({
    appendSetCookie(value: string) {
      try {
        const existing = response.getHeader('Set-Cookie');
        const values = existing === undefined ? [] : typeof existing === 'string' ? [existing] : Array.isArray(existing) ? [...existing] : fail('dependency_unavailable');
        if (!values.every((entry) => typeof entry === 'string')) fail('dependency_unavailable');
        response.setHeader('Set-Cookie', [...values, value]);
      } catch { fail('dependency_unavailable'); }
    },
  });
}

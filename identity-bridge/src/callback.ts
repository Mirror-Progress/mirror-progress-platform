import type { Config } from './config.js';
import { fail } from './errors.js';
import type { AuthorizationCallback } from './types.js';
import { boundedString, isRandomValue } from './validation.js';

export interface ParsedCallback {
  readonly state: string;
  readonly code: string | undefined;
  readonly error: string | undefined;
}

export function parseCallback(config: Config, callback: AuthorizationCallback): ParsedCallback {
  if (!callback || callback.method !== 'GET' || typeof callback.rawUrl !== 'string' || callback.rawUrl.length > 8192 || /[\u0000-\u0020\u007f-\uffff\\#]/u.test(callback.rawUrl)) fail('callback_invalid');
  const question = callback.rawUrl.indexOf('?');
  if (question < 0 || callback.rawUrl.slice(0, question) !== config.callbackPath) fail('callback_invalid');
  const rawQuery = callback.rawUrl.slice(question + 1);
  // URLSearchParams tolerates malformed percent/UTF-8 encodings; this profile does not.
  try {
    const decoded = decodeURIComponent(rawQuery.replace(/\+/gu, ' '));
    if (/[\u0000-\u001f\u007f-\u009f]/u.test(decoded)) fail('callback_invalid');
  } catch { fail('callback_invalid'); }
  const parameters = new URLSearchParams(rawQuery);
  const allowed = new Set(['state', 'code', 'iss', 'error', 'error_description', 'error_uri', 'session_state']);
  const seen = new Set<string>();
  for (const [key, value] of parameters) {
    if (!allowed.has(key) || seen.has(key) || value.length > (key === 'code' ? 2048 : 1024)) fail('callback_invalid');
    seen.add(key);
  }
  const state = parameters.get('state');
  if (!isRandomValue(state)) fail('state_mismatch');
  // RFC 9207 issuer response parameter is mandatory for this bounded profile.
  if (parameters.get('iss') !== config.issuer) fail('callback_invalid');
  const code = parameters.get('code') ?? undefined;
  const error = parameters.get('error') ?? undefined;
  if ((code === undefined) === (error === undefined)) fail('callback_invalid');
  if (code !== undefined && (!boundedString(code, 2048) || !/^[\x21-\x7e]+$/u.test(code))) fail('callback_invalid');
  if (error !== undefined && !/^[A-Za-z_]{1,64}$/u.test(error)) fail('callback_invalid');
  if (code !== undefined && (parameters.has('error_description') || parameters.has('error_uri'))) fail('callback_invalid');
  return { state, code, error };
}

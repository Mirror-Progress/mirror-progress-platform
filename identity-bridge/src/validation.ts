import { timingSafeEqual } from 'node:crypto';
import { fail } from './errors.js';
import type { IdentityBridgeErrorCode } from './errors.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u0020\u007f-\u009f]/u.test(value);
}

export function numericDate(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 253402300799;
}

export function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export function decodeBase64Url(value: unknown, code: IdentityBridgeErrorCode, maxBytes: number): Buffer {
  if (typeof value !== 'string' || value.length === 0 || value.length > Math.ceil(maxBytes * 4 / 3) || !/^[A-Za-z0-9_-]+$/u.test(value)) fail(code);
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length > maxBytes || bytes.toString('base64url') !== value) fail(code);
  return bytes;
}

export function isRandomValue(value: unknown, bytes = 32): value is string {
  if (typeof value !== 'string' || value.length !== Math.ceil(bytes * 4 / 3) || !/^[A-Za-z0-9_-]+$/u.test(value)) return false;
  const decoded = Buffer.from(value, 'base64url');
  return decoded.length === bytes && decoded.toString('base64url') === value;
}

/** Intentionally narrow: no query, fragment, escaping, Unicode, normalization, or dot segments. */
export function safeReturnTo(value: unknown): string {
  if (value === undefined) return '/workspace';
  if (typeof value !== 'string' || value.length === 0 || value.length > 512 || !/^\/[A-Za-z0-9/_.~-]+$/u.test(value)) fail('return_to_invalid');
  if (value.includes('//') || value.split('/').some((part) => part === '.' || part === '..')) fail('return_to_invalid');
  const roots = ['/workspace', '/admin', '/apps/studioiq'];
  if (!roots.some((root) => value === root || value.startsWith(`${root}/`))) fail('return_to_invalid');
  return value;
}

/** A valid JSON grammar is delegated to JSON.parse; this pass rejects duplicate decoded names. */
export function parseJsonObject(text: string, code: IdentityBridgeErrorCode): Record<string, unknown> {
  let result: unknown;
  try { result = JSON.parse(text) as unknown; } catch { fail(code); }
  if (!isRecord(result)) fail(code);
  // JSON.parse has already validated the grammar, including string escapes and primitive values.
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}[\]:,]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/gu) ?? [];
  const stack: (Set<string> | null)[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '{') stack.push(new Set());
    else if (token === '[') stack.push(null);
    else if (token === '}' || token === ']') stack.pop();
    else if (token?.startsWith('"') && tokens[i + 1] === ':') {
      const keys = stack.at(-1);
      if (!keys) fail(code);
      const key = JSON.parse(token) as string;
      if (keys.has(key)) fail(code);
      keys.add(key);
    }
    if (stack.length > 32) fail(code);
  }
  return result;
}

export function utf8(bytes: Uint8Array, code: IdentityBridgeErrorCode): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail(code); }
}

import { fail, IdentityBridgeError } from './errors.js';
import type { IdentityBridgeErrorCode } from './errors.js';
import type { Fetch } from './types.js';
import { parseJsonObject, utf8 } from './validation.js';

/** Bounds even an injected dependency that ignores AbortSignal. Late work cannot return identity. */
export async function deadline<T>(work: (signal: AbortSignal) => Promise<T>, milliseconds: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new IdentityBridgeError('dependency_unavailable'));
    }, milliseconds);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => work(controller.signal)), timeout]);
  } catch (error) {
    if (error instanceof IdentityBridgeError) throw error;
    return fail('dependency_unavailable');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    controller.abort();
  }
}

async function readBody(response: Response, maxBytes: number, signal: AbortSignal, invalid: IdentityBridgeErrorCode): Promise<string> {
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/u.test(length) || !Number.isSafeInteger(Number(length)) || Number(length) > maxBytes)) {
    void response.body?.cancel().catch(() => undefined);
    fail(invalid);
  }
  if (!response.body) fail(invalid);
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (signal.aborted) fail('dependency_unavailable');
    for (;;) {
      const { done, value } = await reader.read();
      if (signal.aborted) fail('dependency_unavailable');
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { cancel(); fail(invalid); }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
  return utf8(Buffer.concat(chunks, size), invalid);
}

export async function fetchJson(
  fetcher: Fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  invalid: IdentityBridgeErrorCode,
  maxBytes = 65536,
  jwks = false,
): Promise<Record<string, unknown>> {
  return deadline(async (signal) => {
    const headers = new Headers(init.headers);
    headers.set('accept', jwks ? 'application/json, application/jwk-set+json' : 'application/json');
    const response = await fetcher(url, {
      ...init,
      headers,
      signal,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    if (signal.aborted) fail('dependency_unavailable');
    if (response.status !== 200 || response.redirected || (response.url !== '' && response.url !== url)) {
      void response.body?.cancel().catch(() => undefined);
      fail(invalid);
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (contentType !== 'application/json' && !(jwks && contentType === 'application/jwk-set+json')) {
      void response.body?.cancel().catch(() => undefined);
      fail(invalid);
    }
    return parseJsonObject(await readBody(response, maxBytes, signal, invalid), invalid);
  }, timeoutMs);
}

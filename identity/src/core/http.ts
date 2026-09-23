import { createServer } from "node:http";
import type { RequestListener, Server } from "node:http";
import { createServer as createTlsServer } from "node:https";
import type { ServerOptions, Server as TlsServer } from "node:https";
export type IdentityHandler = (request: Request, ip: string) => Promise<Response>;
/** The same native HTTP transport is used by the service and the offline transport tests. */
export function createIdentityHttpServer(origin: string, handler: IdentityHandler, tls?: ServerOptions): Server | TlsServer {
  if ((new URL(origin).protocol === "https:") !== Boolean(tls)) throw new Error("TLS must match the configured origin");
  const expectedHost = new URL(origin).host;
  const listener: RequestListener = async (incoming, outgoing) => {
    const deny = (status: number, code: string) => {
      outgoing.writeHead(status, { "content-type": "application/json", "cache-control": "no-store", connection: "close" });
      outgoing.end(JSON.stringify({ error: code }));
    };
    try {
      const hostCount = incoming.rawHeaders.filter((_, i) => i % 2 === 0 && incoming.rawHeaders[i]!.toLowerCase() === "host").length;
      if (hostCount !== 1 || incoming.headers.host !== expectedHost) { deny(400, "invalid_host"); return; }
      const target = incoming.url ?? "/";
      const url = new URL(target, origin);
      if (!target.startsWith("/") || target.startsWith("//") || url.origin !== origin) { deny(400, "invalid_request_target"); return; }
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of incoming) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > 32_768) { deny(413, "body_too_large"); return; }
        chunks.push(buffer);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) for (const item of value) headers.append(key, item);
        else if (value !== undefined) headers.set(key, value);
      }
      const method = incoming.method ?? "GET";
      const request = new Request(url, { method, headers,
        ...(["GET", "HEAD"].includes(method) ? {} : { body: new Uint8Array(Buffer.concat(chunks)).buffer }) });
      const response = await handler(request, incoming.socket.remoteAddress ?? "unknown");
      outgoing.statusCode = response.status;
      for (const [key, value] of response.headers) if (key !== "set-cookie") outgoing.setHeader(key, value);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) outgoing.setHeader("set-cookie", cookies);
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      if (!outgoing.headersSent) deny(500, "request_failed");
      else outgoing.destroy();
    }
  };
  const server = tls ? createTlsServer({ ...tls, minVersion: "TLSv1.2" }, listener) : createServer(listener);
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.maxHeadersCount = 50;
  return server;
}

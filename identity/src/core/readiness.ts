import { createServer } from "node:http";
/** Dedicated private ALB health port. Never dispatches a request into authentication. */
export function createReadinessServer(check: () => Promise<void>) {
  let checking: Promise<void> | undefined;
  const server = createServer(async (request, response) => {
    response.setHeader("cache-control", "no-store");
    response.setHeader("content-type", "application/json");
    if (request.method !== "GET" || request.url !== "/health/ready") {
      response.writeHead(404); response.end('{"error":"not_found"}'); return;
    }
    try {
      // Share only concurrent checks, never cache a previous successful check.
      checking ??= check().finally(() => { checking = undefined; });
      await checking;
      response.writeHead(200); response.end('{"ready":true}');
    } catch { response.writeHead(503); response.end('{"ready":false}'); }
  });
  server.requestTimeout = 5000; server.headersTimeout = 5000; server.maxHeadersCount = 10;
  return server;
}

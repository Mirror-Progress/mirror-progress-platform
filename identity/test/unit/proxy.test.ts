import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { trustedAlbPeers, albClientAddress } from "../../src/core/proxy.js";
import { createReadinessServer } from "../../src/core/readiness.js";
import { createIdentityHttpServer } from "../../src/core/http.js";
const cidrs = ["10.0.0.0/24", "10.0.1.0/24"];
const trusted = trustedAlbPeers(cidrs);
const headers = { "x-forwarded-for": "192.0.2.10", "x-forwarded-proto": "https", "x-forwarded-port": "443" };
test("ALB trusts only configured subnets, including Node IPv4-mapped peers", () => {
  for (const address of ["10.0.0.5", "10.0.1.25", "::ffff:10.0.1.25"]) assert.equal(trusted(address), true);
  for (const address of ["10.0.2.1", "127.0.0.1", "192.0.2.1", "::1", "bad"]) assert.equal(trusted(address), false);
  for (const ranges of [["0.0.0.0/0", "10.0.1.0/24"], ["10.0.0.5/24", "10.0.1.0/24"],
    ["192.0.2.0/24", "10.0.1.0/24"], [cidrs[0]!], [cidrs[0]!, cidrs[0]!]]) assert.throws(() => trustedAlbPeers(ranges));
});
test("ALB append mode ignores spoofed prefixes and canonicalizes IPv6", () => {
  assert.equal(albClientAddress("10.0.0.5", { ...headers, "x-forwarded-for": "forged, 127.0.0.1, 192.0.2.10" }, trusted), "192.0.2.10");
  assert.equal(albClientAddress("10.0.0.5", { ...headers, "x-forwarded-for": "2001:0DB8:0:0:0:0:0:1" }, trusted), "2001:db8::1");
  assert.throws(() => albClientAddress("127.0.0.1", headers, trusted));
  for (const delta of [{ "x-forwarded-for": "192.0.2.1," }, { "x-forwarded-for": "192.0.2.1:54321" },
    { "x-forwarded-for": ["192.0.2.1"] }, { "x-forwarded-proto": "http" }, { "x-forwarded-proto": "http,https" },
    { "x-forwarded-port": "80" }]) assert.throws(() => albClientAddress("10.0.0.5", { ...headers, ...delta }, trusted));
});
async function get(server: ReturnType<typeof createReadinessServer>, path: string, host = "127.0.0.1") {
  const address = server.address(); assert.ok(address && typeof address !== "string");
  return await new Promise<{status:number; body:string}>((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port: address.port, path, headers: {host} }, response => {
      let body = ""; response.on("data", chunk => body += String(chunk));
      response.on("end", () => resolve({ status: response.statusCode!, body }));
    }); req.on("error", reject); req.end();
  });
}
test("health listener accepts ALB IP Host but exposes only readiness and fails closed", async () => {
  let healthy = true;
  const server = createReadinessServer(async () => { if (!healthy) throw new Error("private SQL credentials"); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    assert.equal((await get(server, "/health/ready", "10.0.2.9:3041")).status, 200);
    for (const path of ["/", "/api/auth/sign-in", "/internal/identity/session-status", "/health/ready?anything=1"]) assert.equal((await get(server, path)).status, 404);
    healthy = false;
    assert.deepEqual(await get(server, "/health/ready"), {status:503,body:'{"ready":false}'});
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
test("native authentication listener rejects a direct client claiming ALB forwarding", async () => {
  const server = createIdentityHttpServer("http://localhost:3040", async () => new Response("unexpected"), undefined, cidrs);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try { assert.equal((await get(server, "/", "localhost:3040")).status, 400); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

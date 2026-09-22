/** Real TCP/HTTP tests of the shared transport, not mocked Better Auth tests. */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import type { OutgoingHttpHeaders } from "node:http";
import { createIdentityHttpServer } from "../../src/core/http.js";
let port = 0;
const server = createIdentityHttpServer("http://localhost:3040", async incoming => {
  if (new URL(incoming.url).pathname === "/throw") throw new Error("synthetic-secret-must-not-escape");
  if (new URL(incoming.url).pathname === "/cookies") {
    const headers = new Headers(); headers.append("set-cookie", "a=one; HttpOnly"); headers.append("set-cookie", "b=two; HttpOnly");
    return new Response("cookies", { headers });
  }
  return new Response(JSON.stringify({ url: incoming.url, method: incoming.method, body: await incoming.text() }));
});
before(async () => { await new Promise<void>(resolve => server.listen(0,"127.0.0.1",resolve)); const addr=server.address();assert.ok(addr && typeof addr!=="string");port=addr.port; });
after(async () => { await new Promise<void>((resolve,reject) => server.close(error=>error?reject(error):resolve())); });
function send(path: string, body?: string, headers: OutgoingHttpHeaders = {}) {
  return new Promise<{status:number;body:string;cookies:string[]}>((resolve,reject) => {
    const req=request({hostname:"127.0.0.1",port,path,method:body===undefined?"GET":"POST",headers:{host:"localhost:3040",...headers}},response=>{
      const chunks:Buffer[]=[];response.on("data",chunk=>chunks.push(Buffer.from(chunk)));
      response.on("end",()=>resolve({status:response.statusCode??0,body:Buffer.concat(chunks).toString(),cookies:response.headers["set-cookie"]??[]}));
      response.on("error",reject);
    });req.on("error",reject);req.end(body);
  });
}
test("native transport passes a bounded request with canonical origin",async()=>{
  const response=await send("/echo","synthetic body");assert.equal(response.status,200);
  assert.deepEqual(JSON.parse(response.body),{url:"http://localhost:3040/echo",method:"POST",body:"synthetic body"});
});
test("native transport rejects a foreign Host",async()=>{const response=await send("/",undefined,{host:"attacker.invalid"});assert.equal(response.status,400);});
test("native transport rejects ambiguous duplicate Host headers",async()=>{
  const status = await new Promise<number>((resolve,reject) => {
    const req=request({hostname:"127.0.0.1",port,path:"/",headers:["Host","localhost:3040","Host","attacker.invalid"]}, response=>{
      response.resume();response.on("end",()=>resolve(response.statusCode??0));response.on("error",reject);
    });req.on("error",reject);req.end();
  });assert.equal(status,400);
});
test("native transport rejects absolute and protocol-relative request targets",async()=>{
  for(const path of ["http://attacker.invalid/x","//attacker.invalid/x","/\\attacker.invalid/x"]){const response=await send(path);assert.equal(response.status,400);}
});
test("native transport enforces the 32 KiB body limit before dispatch",async()=>{const response=await send("/echo","x".repeat(32769));assert.equal(response.status,413);});
test("native transport preserves independent Set-Cookie headers",async()=>{const response=await send("/cookies");assert.equal(response.status,200);assert.deepEqual(response.cookies,["a=one; HttpOnly","b=two; HttpOnly"]);});
test("native transport never returns exception details",async()=>{const response=await send("/throw");assert.equal(response.status,500);assert.equal(response.body,'{"error":"request_failed"}');});

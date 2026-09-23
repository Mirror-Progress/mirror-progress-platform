import test from 'node:test';import assert from 'node:assert/strict';import {SesEnrollmentTransport} from '../../src/core/ses-delivery.js';
test('SES sender bounds recipients and token destination before sending; deduplicates accepted IDs',async()=>{
 const commands:any[]=[];const client={send:async(c:unknown)=>{commands.push(c);return {};},destroy:()=>{}};
 const transport=new SesEnrollmentTransport(client as any);
 const message={idempotencyKey:'synthetic-delivery',to:'owner@mirrorprogress.com',url:'https://accounts.mirrorprogress.com/#mailboxToken='+'a'.repeat(43),expiresAt:new Date(Date.now()+60000)};
 await assert.rejects(transport.send({...message,to:'outside@example.invalid'}));
 await assert.rejects(transport.send({...message,url:'https://attacker.invalid/#mailboxToken='+'a'.repeat(43)}));
 assert.equal(commands.length,0);await transport.send(message);await transport.send(message);assert.equal(commands.length,1);
 assert.equal(commands[0].input.FromEmailAddress,'identity@mirrorprogress.com');
});

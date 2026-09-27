import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphEnrollmentTransport } from '../../src/core/graph-delivery.js';

test('Graph transport sends a branded managed invite from the hello mailbox', async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const request = (async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    if (url.includes('/oauth2/')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    return new Response(null, { status: 202 });
  }) as typeof fetch;
  const delivery = new GraphEnrollmentTransport('cd1b4d15-ba3e-41b9-a0ec-f7a9ed1027f5',
    '4de476ef-b1df-4777-b45b-241ec6722627', 'test-secret', request);
  const message = { idempotencyKey: 'first', to: 'recipient@example.com',
    url: `https://accounts.mirrorprogress.com/#invitation=${'a'.repeat(43)}`,
    expiresAt: new Date(Date.now() + 600_000), inviteeName: 'Alex', company: 'Example' };
  await delivery.send(message);
  await delivery.send(message);
  assert.equal(requests.length, 2);
  assert.equal(requests[1]?.url, 'https://graph.microsoft.com/v1.0/users/hello%40mirrorprogress.com/sendMail');
  const body = JSON.parse(requests[1]!.init.body as string);
  assert.equal(body.message.toRecipients[0].emailAddress.address, message.to);
  assert.match(body.message.body.content, /Mirror Progress/);
  assert.equal(body.saveToSentItems, true);
});

test('Graph transport refuses untrusted links and does not accept failed sends', async () => {
  let calls = 0;
  const request = (async (url: string) => {
    calls++;
    return url.includes('/oauth2/')
      ? Response.json({ access_token: 'test-token', expires_in: 3600 })
      : new Response(null, { status: 403 });
  }) as typeof fetch;
  const delivery = new GraphEnrollmentTransport('cd1b4d15-ba3e-41b9-a0ec-f7a9ed1027f5',
    '4de476ef-b1df-4777-b45b-241ec6722627', 'test-secret', request);
  const message = { idempotencyKey: 'retry', to: 'recipient@example.com',
    url: `https://accounts.mirrorprogress.com/#invitation=${'a'.repeat(43)}`,
    expiresAt: new Date(Date.now() + 600_000), inviteeName: 'Alex', company: 'Example' };
  await assert.rejects(delivery.send({ ...message, url: `https://attacker.example/#invitation=${'a'.repeat(43)}` }));
  assert.equal(calls, 0);
  await assert.rejects(delivery.send(message), /graph_mail_send_failed:403/);
  await assert.rejects(delivery.send(message), /graph_mail_send_failed:403/);
  assert.equal(calls, 3);
});

test('Graph password recovery uses the hello mailbox and refuses foreign links', async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const request = (async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    return url.includes('/oauth2/') ? Response.json({ access_token: 'test-token', expires_in: 3600 })
      : new Response(null, { status: 202 });
  }) as typeof fetch;
  const delivery = new GraphEnrollmentTransport('cd1b4d15-ba3e-41b9-a0ec-f7a9ed1027f5',
    '4de476ef-b1df-4777-b45b-241ec6722627', 'test-secret', request);
  const message = { to: 'person@example.com', name: 'Alex',
    url: `https://accounts.mirrorprogress.com/#reset=${'a'.repeat(24)}` };
  await assert.rejects(delivery.sendPasswordResetEmail({ ...message, url: `https://attacker.invalid/#reset=${'a'.repeat(24)}` }));
  assert.equal(requests.length, 0);
  await delivery.sendPasswordResetEmail(message);
  assert.equal(requests[1]?.url, 'https://graph.microsoft.com/v1.0/users/hello%40mirrorprogress.com/sendMail');
  const body = JSON.parse(requests[1]!.init.body as string);
  assert.equal(body.message.toRecipients[0].emailAddress.address, message.to);
  assert.equal(body.message.subject, 'Reset your Mirror Progress Prospect password');
  assert.match(body.message.body.content, /Reset your Prospect password/);
});

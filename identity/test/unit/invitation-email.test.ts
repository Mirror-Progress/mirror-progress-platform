import assert from 'node:assert/strict';
import test from 'node:test';
import { invitationEmail } from '../../src/core/invitation-email.js';

test('branded invitation contains one safe setup link and escapes personal details', () => {
  const token = 'A'.repeat(43);
  const url = `https://accounts.mirrorprogress.com/#invitation=${token}`;
  const email = invitationEmail({ to: 'person@example.com', name: '<script> Kim',
    company: 'Example & Co', url, expiresAt: new Date(Date.now() + 86_400_000) });
  assert.match(email.subject, /Mirror Progress Prospect/);
  assert.match(email.text, /Create your account:/);
  assert.equal(email.text.split(url).length, 2);
  assert.match(email.html, /Example &amp; Co/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /Create your account/);
});

test('invitation email rejects a non-account URL', () => {
  assert.throws(() => invitationEmail({ to: 'person@example.com', name: 'Person', company: 'Example',
    url: `https://example.com/#invitation=${'A'.repeat(43)}`, expiresAt: new Date(Date.now() + 86_400_000) }));
});

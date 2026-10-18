import assert from 'node:assert/strict';
import test from 'node:test';
import { invitationEmail, DEFAULT_SELF_SERVE_TRIAL_DAYS } from '../../src/core/invitation-email.js';

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

test('self-serve trial invitation uses trial copy with one start link, expiry and an ignore line', () => {
  const token = 'B'.repeat(43);
  const url = `https://accounts.mirrorprogress.com/#invitation=${token}`;
  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  const email = invitationEmail({ to: 'maya@northlight.example', name: 'Maya Chen', company: 'Northlight & Partners',
    url, expiresAt, kind: 'self_serve_trial' });
  assert.equal(DEFAULT_SELF_SERVE_TRIAL_DAYS, 14);
  assert.equal(email.subject, 'Start your 14-day Prospect trial');
  assert.match(email.text, /^Hi Maya,/);
  assert.match(email.text, /trial for Northlight & Partners is ready/);
  assert.match(email.text, /starts when you first sign in and lasts 14 days\. No card is required\./);
  assert.match(email.text, new RegExp(`expires ${expiresAt.toUTCString()}`));
  assert.match(email.text, /If you didn't request this, ignore this email\./);
  assert.equal(email.text.split(url).length, 2);
  assert.match(email.html, /Northlight &amp; Partners/);
  assert.equal(email.html.split('<a ').length, 2, 'exactly one button');
  assert.match(email.html, />Start your trial</);
  assert.match(email.html, /If you didn&#39;t request this, ignore this email\.|If you didn't request this, ignore this email\./);
  assert.doesNotMatch(email.text + email.html, /invited/i);
});

test('standard invitation copy is unchanged when no kind or the standard kind is given', () => {
  const url = `https://accounts.mirrorprogress.com/#invitation=${'C'.repeat(43)}`;
  const message = { to: 'p@example.com', name: 'Pat', company: 'Example', url, expiresAt: new Date(Date.now() + 86_400_000) };
  const plain = invitationEmail(message);
  assert.deepEqual(invitationEmail({ ...message, kind: 'standard' }), plain);
  assert.equal(plain.subject, "You're invited to Mirror Progress Prospect");
  assert.doesNotMatch(plain.text, /trial/i);
});

test('only the local preview may render a loopback invitation link', () => {
  const url = `http://localhost:3040/#invitation=${'D'.repeat(43)}`;
  const message = { to: 'p@example.com', name: 'Pat', company: 'Example', url, expiresAt: new Date(Date.now() + 86_400_000) };
  assert.throws(() => invitationEmail(message));
  assert.match(invitationEmail(message, { origin: 'http://localhost:3040' }).text, /Create your account/);
});

test('self-serve trial copy uses the stored trial length and rejects out-of-range values', () => {
  const url = `https://accounts.mirrorprogress.com/#invitation=${'E'.repeat(43)}`;
  const message = { to: 'p@example.com', name: 'Pat', company: 'Example', url, expiresAt: new Date(Date.now() + 86_400_000),
    kind: 'self_serve_trial' as const };
  const thirty = invitationEmail({ ...message, trialDays: 30 });
  assert.equal(thirty.subject, 'Start your 30-day Prospect trial');
  assert.match(thirty.text, /lasts 30 days\./);
  assert.match(thirty.html, /Start your 30-day Prospect trial/);
  assert.doesNotMatch(thirty.text + thirty.html, /14-day|14 days/);
  assert.equal(invitationEmail(message).subject, 'Start your 14-day Prospect trial');
  for (const trialDays of [0, 366, 1.5, Number.NaN]) assert.throws(() => invitationEmail({ ...message, trialDays }));
});

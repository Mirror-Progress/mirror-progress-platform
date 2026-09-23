import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
// Separate from the authentication secret. AEAD binds ciphertext to its durable outbox ID.
export function sealDelivery(key: string, id: string, mailboxToken: string): string {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "base64url"), iv);
  cipher.setAAD(Buffer.from(`mirror-mailbox-v1:${id}`));
  const data = Buffer.concat([cipher.update(mailboxToken, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function openDelivery(key: string, id: string, sealed: string): string {
  const data = Buffer.from(sealed, "base64url");
  if (data.length !== 71) throw new Error("Invalid delivery envelope");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "base64url"), data.subarray(0, 12));
  decipher.setAAD(Buffer.from(`mirror-mailbox-v1:${id}`)); decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
}
export interface EnrollmentMessage { idempotencyKey: string; to: string; url: string; expiresAt: Date }
export interface EnrollmentTransport {
  // Implementations deduplicate accepted IDs where supported and use a bounded timeout.
  // Providers without an idempotency API may redeliver the same token after an ambiguous failure.
  // Acceptance is delivery bookkeeping, NEVER evidence of mailbox possession.
  send(message: EnrollmentMessage): Promise<void>;
}
/** Test-only sink. No provider, network operation, console output, or persistent raw token. */
export class FakeEnrollmentTransport implements EnrollmentTransport {
  readonly messages = new Map<string, EnrollmentMessage>();
  failures = 0;
  async send(message: EnrollmentMessage): Promise<void> {
    if (this.failures > 0) { this.failures--; throw new Error("Synthetic transport failure"); }
    if (!this.messages.has(message.idempotencyKey)) this.messages.set(message.idempotencyKey, { ...message });
  }
}

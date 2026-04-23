import crypto from 'crypto';
import path from 'path';
import {
  findAccountByEmail,
  findAccountById,
  updateAccountPassword,
} from './accounts';
import { dataDir, ensureJsonFile, readJsonText, writeJsonFile } from './storage';

interface PasswordResetRecord {
  token: string;
  accountId: string;
  emailLower: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

const RESET_TTL_MS = 1000 * 60 * 60;
const resetPath = path.join(dataDir, 'password-resets.local.json');

async function ensureResetFile() {
  await ensureJsonFile(resetPath, () => []);
}

async function writeResetRecords(records: PasswordResetRecord[]) {
  await ensureResetFile();
  await writeJsonFile(resetPath, records);
}

function isResetUsable(record: PasswordResetRecord) {
  return !record.consumedAt && new Date(record.expiresAt).getTime() > Date.now();
}

async function readResetRecords() {
  await ensureResetFile();
  const raw = await readJsonText(resetPath);

  try {
    const parsed = JSON.parse(raw) as PasswordResetRecord[];
    const normalized = Array.isArray(parsed)
      ? parsed.filter(
          (record): record is PasswordResetRecord =>
            Boolean(
              record &&
                record.token &&
                record.accountId &&
                record.emailLower &&
                record.createdAt &&
                record.expiresAt
            )
        )
      : [];
    const pruned = normalized.filter(
      (record) =>
        Boolean(record.consumedAt) ||
        new Date(record.expiresAt).getTime() > Date.now() - RESET_TTL_MS
    );

    if (pruned.length !== normalized.length) {
      await writeResetRecords(pruned);
    }

    return pruned;
  } catch {
    await writeResetRecords([]);
    return [];
  }
}

export async function createPasswordResetRequest(email: string) {
  const account = await findAccountByEmail(email);

  if (!account) {
    return null;
  }

  const records = await readResetRecords();
  const nextRecords = records.filter(
    (record) => record.accountId !== account.id || !isResetUsable(record)
  );
  const token = crypto.randomBytes(24).toString('hex');
  const record: PasswordResetRecord = {
    token,
    accountId: account.id,
    emailLower: account.emailLower,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    consumedAt: null,
  };

  nextRecords.push(record);
  await writeResetRecords(nextRecords);

  return {
    token,
    email: account.email,
    expiresAt: record.expiresAt,
    resetPath: `/account/reset-password?token=${token}`,
  };
}

export async function validatePasswordResetToken(token: string) {
  const records = await readResetRecords();
  const record = records.find((entry) => entry.token === token);

  if (!record || !isResetUsable(record)) {
    return null;
  }

  const account = await findAccountById(record.accountId);

  if (!account) {
    return null;
  }

  return {
    accountId: account.id,
    email: account.email,
    expiresAt: record.expiresAt,
  };
}

export async function consumePasswordResetToken(token: string, password: string) {
  const records = await readResetRecords();
  const index = records.findIndex((entry) => entry.token === token);

  if (index === -1 || !isResetUsable(records[index])) {
    throw new Error('This password reset link is invalid or has expired.');
  }

  const record = records[index];
  await updateAccountPassword(record.accountId, password);

  records[index] = {
    ...record,
    consumedAt: new Date().toISOString(),
  };

  await writeResetRecords(records);
}

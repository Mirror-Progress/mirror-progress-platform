import crypto from 'crypto';
import { findAccountByEmail, findAccountById, updateAccountPassword } from './accounts';
import { ensureMongoBootstrap } from './mongodb-bootstrap';
import { getDb } from './mongodb';

interface PasswordResetRecord {
  token: string;
  accountId: string;
  emailLower: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

interface PasswordResetDocument extends PasswordResetRecord {
  _id: string;
}

const RESET_TTL_MS = 1000 * 60 * 60;

function passwordResetsCollection() {
  return getDb().then((db) =>
    db.collection<PasswordResetDocument>('password_resets')
  );
}

function isResetUsable(record: PasswordResetRecord) {
  return !record.consumedAt && new Date(record.expiresAt).getTime() > Date.now();
}

export async function createPasswordResetRequest(email: string) {
  await ensureMongoBootstrap();
  const account = await findAccountByEmail(email);

  if (!account) {
    return null;
  }

  const collection = await passwordResetsCollection();
  const token = crypto.randomBytes(24).toString('hex');
  const record: PasswordResetRecord = {
    token,
    accountId: account.id,
    emailLower: account.emailLower,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    consumedAt: null,
  };

  await collection.deleteMany({
    accountId: account.id,
    $or: [
      { consumedAt: { $ne: null } },
      { expiresAt: { $lte: new Date().toISOString() } },
    ],
  });

  await collection.insertOne({
    _id: token,
    ...record,
  });

  return {
    token,
    email: account.email,
    expiresAt: record.expiresAt,
    resetPath: `/account/reset-password?token=${token}`,
  };
}

export async function validatePasswordResetToken(token: string) {
  await ensureMongoBootstrap();
  const collection = await passwordResetsCollection();
  const record = await collection.findOne({ _id: token });

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
  await ensureMongoBootstrap();
  const collection = await passwordResetsCollection();
  const record = await collection.findOne({ _id: token });

  if (!record || !isResetUsable(record)) {
    throw new Error('This password reset link is invalid or has expired.');
  }

  await updateAccountPassword(record.accountId, password);

  await collection.updateOne(
    { _id: token },
    {
      $set: {
        consumedAt: new Date().toISOString(),
      },
    }
  );
}

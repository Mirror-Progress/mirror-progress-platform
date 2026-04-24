import crypto from 'crypto';
import { hashPassword, verifyPassword as verifyStoredPassword } from './auth-crypto';
import { ensureMongoBootstrap } from './mongodb-bootstrap';
import { getDb } from './mongodb';
import { DEV_SEED_ACCOUNTS } from './seed-data';
import type { InviteStatus, UserRole, UserStatus } from './workspace-data';

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  emailLower: string;
  company: string;
  passwordHash: string;
  createdAt: string;
  role: UserRole;
  status: UserStatus;
  clientId: string | null;
  assignedProjectIds: string[];
  inviteStatus: InviteStatus;
  lastLoginAt: string | null;
}

interface UserDocument extends StoredAccount {
  _id: string;
}

function usersCollection() {
  return getDb().then((db) => db.collection<UserDocument>('users'));
}

function normalizeStoredAccount(
  account: Partial<StoredAccount> &
    Pick<
      StoredAccount,
      'id' | 'name' | 'email' | 'emailLower' | 'company' | 'passwordHash' | 'createdAt'
    >
): StoredAccount {
  return {
    ...account,
    role: account.role ?? 'client',
    status: account.status ?? 'active',
    clientId: account.clientId ?? null,
    assignedProjectIds: Array.isArray(account.assignedProjectIds)
      ? account.assignedProjectIds.filter(
          (projectId): projectId is string =>
            typeof projectId === 'string' && projectId.trim().length > 0
        )
      : [],
    inviteStatus: account.inviteStatus ?? 'accepted',
    lastLoginAt: account.lastLoginAt ?? null,
  };
}

function toStoredAccount(document: UserDocument | null) {
  if (!document) {
    return null;
  }

  return normalizeStoredAccount({
    id: document.id || document._id,
    name: document.name,
    email: document.email,
    emailLower: document.emailLower,
    company: document.company,
    passwordHash: document.passwordHash,
    createdAt: document.createdAt,
    role: document.role,
    status: document.status,
    clientId: document.clientId,
    assignedProjectIds: document.assignedProjectIds,
    inviteStatus: document.inviteStatus,
    lastLoginAt: document.lastLoginAt,
  });
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

export const verifyPassword = verifyStoredPassword;

export async function readAccounts(): Promise<StoredAccount[]> {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const accounts = await collection.find({}).sort({ createdAt: 1 }).toArray();
  return accounts
    .map((account) => toStoredAccount(account))
    .filter((account): account is StoredAccount => Boolean(account));
}

export async function findAccountByEmail(email: string) {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const account = await collection.findOne({
    emailLower: email.trim().toLowerCase(),
  });
  return toStoredAccount(account);
}

export async function findAccountById(accountId: string) {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const account = await collection.findOne({ _id: accountId });
  return toStoredAccount(account);
}

export async function listAccounts() {
  return readAccounts();
}

export function isAdminRole(role: UserRole) {
  return role === 'super_admin' || role === 'admin' || role === 'project_lead';
}

export async function createAccount(input: {
  name: string;
  email: string;
  company: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  clientId?: string | null;
  assignedProjectIds?: string[];
  inviteStatus?: InviteStatus;
}) {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const email = input.email.trim();
  const emailLower = email.toLowerCase();

  const account = normalizeStoredAccount({
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    emailLower,
    company: input.company.trim(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
    role: input.role ?? 'client',
    status: input.status ?? 'active',
    clientId: input.clientId ?? null,
    assignedProjectIds: input.assignedProjectIds ?? [],
    inviteStatus: input.inviteStatus ?? 'accepted',
    lastLoginAt: null,
  });

  try {
    await collection.insertOne({
      _id: account.id,
      ...account,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error('An account with that email already exists.');
    }

    throw error;
  }

  return account;
}

export async function updateAccount(
  accountId: string,
  patch: Partial<
    Pick<
      StoredAccount,
      | 'name'
      | 'company'
      | 'role'
      | 'status'
      | 'clientId'
      | 'assignedProjectIds'
      | 'inviteStatus'
      | 'lastLoginAt'
    >
  >
) {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const currentAccount = await findAccountById(accountId);

  if (!currentAccount) {
    throw new Error('Account not found.');
  }

  const updatedAccount = normalizeStoredAccount({
    ...currentAccount,
    ...patch,
  });

  await collection.updateOne(
    { _id: accountId },
    {
      $set: {
        ...updatedAccount,
        id: accountId,
      },
    }
  );

  return updatedAccount;
}

export async function updateAccountPassword(accountId: string, password: string) {
  await ensureMongoBootstrap();
  const collection = await usersCollection();
  const currentAccount = await findAccountById(accountId);

  if (!currentAccount) {
    throw new Error('Account not found.');
  }

  const updatedAccount = normalizeStoredAccount({
    ...currentAccount,
    passwordHash: hashPassword(password),
  });

  await collection.updateOne(
    { _id: accountId },
    {
      $set: {
        ...updatedAccount,
        id: accountId,
      },
    }
  );

  return updatedAccount;
}

export async function touchAccountLogin(accountId: string) {
  return updateAccount(accountId, {
    lastLoginAt: new Date().toISOString(),
    inviteStatus: 'accepted',
  });
}

export function toSessionUser(account: StoredAccount) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    company: account.company,
    role: account.role,
    status: account.status,
    clientId: account.clientId,
    assignedProjectIds: account.assignedProjectIds,
  };
}

export { DEV_SEED_ACCOUNTS };

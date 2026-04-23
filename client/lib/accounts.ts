import path from 'path';
import crypto from 'crypto';
import type { InviteStatus, UserRole, UserStatus } from './workspace-data';
import { allowDevSeedAccounts } from './app-runtime';
import { dataDir, ensureJsonFile, readJsonText, writeJsonFile } from './storage';

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

export const DEV_SEED_ACCOUNTS = [
  {
    email: 'admin@mirrorprogress.local',
    password: 'MirrorProgressAdmin123!',
    role: 'super_admin' as const,
  },
  {
    email: 'lead@mirrorprogress.local',
    password: 'MirrorProgressLead123!',
    role: 'project_lead' as const,
  },
  {
    email: 'sarah@horizonbiolabs.com',
    password: 'MirrorProgressClient123!',
    role: 'client' as const,
  },
];

const accountsPath = path.join(dataDir, 'accounts.local.json');
const seedCreatedAt = '2026-04-22T08:30:00.000Z';

const seededAccountDefinitions = [
  {
    id: 'user-admin-super',
    name: 'Avery Cole',
    email: 'admin@mirrorprogress.local',
    company: 'Mirror Progress',
    password: 'MirrorProgressAdmin123!',
    role: 'super_admin' as const,
    status: 'active' as const,
    clientId: null,
    assignedProjectIds: [],
    inviteStatus: 'accepted' as const,
  },
  {
    id: 'user-project-lead',
    name: 'Jordan Lee',
    email: 'lead@mirrorprogress.local',
    company: 'Mirror Progress',
    password: 'MirrorProgressLead123!',
    role: 'project_lead' as const,
    status: 'active' as const,
    clientId: null,
    assignedProjectIds: ['project-horizon-refinement', 'project-atlas-ops'],
    inviteStatus: 'accepted' as const,
  },
  {
    id: 'user-client-horizon',
    name: 'Sarah Bennett',
    email: 'sarah@horizonbiolabs.com',
    company: 'Horizon Biolabs',
    password: 'MirrorProgressClient123!',
    role: 'client' as const,
    status: 'active' as const,
    clientId: 'client-horizon-biolabs',
    assignedProjectIds: ['project-horizon-refinement'],
    inviteStatus: 'accepted' as const,
  },
  {
    id: 'user-client-northline',
    name: 'Maya Chen',
    email: 'maya@northlineenergy.com',
    company: 'Northline Energy',
    password: 'MirrorProgressClient123!',
    role: 'client' as const,
    status: 'active' as const,
    clientId: 'client-northline-energy',
    assignedProjectIds: ['project-northline-launch'],
    inviteStatus: 'accepted' as const,
  },
  {
    id: 'user-client-atlas',
    name: 'Elias Porter',
    email: 'elias@atlashealth.io',
    company: 'Atlas Health',
    password: 'MirrorProgressClient123!',
    role: 'client' as const,
    status: 'active' as const,
    clientId: 'client-atlas-health',
    assignedProjectIds: ['project-atlas-ops'],
    inviteStatus: 'accepted' as const,
  },
];
const seededAccountEmails = new Set(
  seededAccountDefinitions.map((definition) => definition.email.toLowerCase())
);

function isInternalSeedRole(role: UserRole) {
  return role === 'super_admin' || role === 'admin' || role === 'project_lead';
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
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
      ? account.assignedProjectIds
      : [],
    inviteStatus: account.inviteStatus ?? 'accepted',
    lastLoginAt: account.lastLoginAt ?? null,
  };
}

function createSeededAccount(
  definition: (typeof seededAccountDefinitions)[number],
  existing?: StoredAccount
) {
  return normalizeStoredAccount({
    id: definition.id,
    name: definition.name,
    email: definition.email,
    emailLower: definition.email.toLowerCase(),
    company: definition.company,
    passwordHash:
      existing?.passwordHash ?? hashPassword(definition.password),
    createdAt: existing?.createdAt ?? seedCreatedAt,
    role: definition.role,
    status: definition.status,
    clientId: definition.clientId,
    assignedProjectIds: definition.assignedProjectIds,
    inviteStatus: definition.inviteStatus,
    lastLoginAt: existing?.lastLoginAt ?? null,
  });
}

function createSeededAccounts(): StoredAccount[] {
  return seededAccountDefinitions.map((definition) =>
    createSeededAccount(definition)
  );
}

function createInitialAccounts() {
  return allowDevSeedAccounts() ? createSeededAccounts() : [];
}

function reconcileSeededAccount(
  definition: (typeof seededAccountDefinitions)[number],
  existing: StoredAccount
) {
  const normalized = normalizeStoredAccount(existing);

  if (isInternalSeedRole(definition.role)) {
    return normalizeStoredAccount({
      ...normalized,
      id: definition.id,
      name: definition.name,
      email: definition.email,
      emailLower: definition.email.toLowerCase(),
      company: definition.company,
      role: definition.role,
    });
  }

  return normalizeStoredAccount({
    ...normalized,
    email: definition.email,
    emailLower: definition.email.toLowerCase(),
    role: 'client',
  });
}

async function ensureDataFile() {
  await ensureJsonFile(accountsPath, createInitialAccounts);
}

async function writeAccounts(accounts: StoredAccount[]) {
  await ensureDataFile();
  await writeJsonFile(accountsPath, accounts);
}

function mergeSeedAccounts(accounts: StoredAccount[]) {
  if (!allowDevSeedAccounts()) {
    const filteredAccounts = accounts.filter(
      (account) => !seededAccountEmails.has(account.emailLower)
    );

    return {
      accounts: filteredAccounts,
      changed: filteredAccounts.length !== accounts.length,
    };
  }

  const byEmail = new Map(accounts.map((account) => [account.emailLower, account]));
  let changed = false;

  seededAccountDefinitions.forEach((definition) => {
    const existing = byEmail.get(definition.email.toLowerCase());

    if (existing) {
      const canonical = reconcileSeededAccount(definition, existing);

      if (JSON.stringify(existing) !== JSON.stringify(canonical)) {
        byEmail.set(canonical.emailLower, canonical);
        changed = true;
      }

      return;
    }

    byEmail.set(definition.email.toLowerCase(), createSeededAccount(definition));
    changed = true;
  });

  return {
    accounts: [...byEmail.values()],
    changed,
  };
}

export async function readAccounts(): Promise<StoredAccount[]> {
  await ensureDataFile();
  const raw = await readJsonText(accountsPath);

  try {
    const parsed = JSON.parse(raw) as Array<Partial<StoredAccount>>;
    const normalized = parsed
      .filter(
        (account): account is Partial<StoredAccount> &
          Pick<
            StoredAccount,
            'id' | 'name' | 'email' | 'emailLower' | 'company' | 'passwordHash' | 'createdAt'
          > =>
          Boolean(
            account.id &&
              account.name &&
              account.email &&
              account.emailLower &&
              account.company &&
              account.passwordHash &&
              account.createdAt
          )
      )
      .map((account) => normalizeStoredAccount(account));

    const merged = mergeSeedAccounts(normalized);

    if (merged.changed) {
      await writeAccounts(merged.accounts);
    }

    return merged.accounts;
  } catch {
    const seededAccounts = createInitialAccounts();
    await writeAccounts(seededAccounts);
    return seededAccounts;
  }
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':');

  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const expectedKey = Buffer.from(expectedHash, 'hex');

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, expectedKey);
}

export async function findAccountByEmail(email: string) {
  const emailLower = email.trim().toLowerCase();
  const accounts = await readAccounts();
  return accounts.find((account) => account.emailLower === emailLower) ?? null;
}

export async function findAccountById(accountId: string) {
  const accounts = await readAccounts();
  return accounts.find((account) => account.id === accountId) ?? null;
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
  const accounts = await readAccounts();
  const email = input.email.trim();
  const emailLower = email.toLowerCase();

  if (accounts.some((account) => account.emailLower === emailLower)) {
    throw new Error('An account with that email already exists.');
  }

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

  accounts.push(account);
  await writeAccounts(accounts);

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
  const accounts = await readAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);

  if (index === -1) {
    throw new Error('Account not found.');
  }

  const updatedAccount = normalizeStoredAccount({
    ...accounts[index],
    ...patch,
  });

  accounts[index] = updatedAccount;
  await writeAccounts(accounts);

  return updatedAccount;
}

export async function updateAccountPassword(accountId: string, password: string) {
  const accounts = await readAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);

  if (index === -1) {
    throw new Error('Account not found.');
  }

  accounts[index] = normalizeStoredAccount({
    ...accounts[index],
    passwordHash: hashPassword(password),
  });

  await writeAccounts(accounts);
  return accounts[index];
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

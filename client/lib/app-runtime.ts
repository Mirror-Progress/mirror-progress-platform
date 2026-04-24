const truthyValues = new Set(['1', 'true', 'yes', 'on']);

function readBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];

  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return truthyValues.has(value.trim().toLowerCase());
}

export function isProtectedMode() {
  return readBooleanEnv('APP_PROTECTED_MODE', false);
}

export function allowPublicSignup() {
  return readBooleanEnv('ALLOW_PUBLIC_SIGNUP', !isProtectedMode());
}

export function allowPasswordReset() {
  return readBooleanEnv('ALLOW_PASSWORD_RESET', !isProtectedMode());
}

export function allowDevSeedAccounts() {
  return readBooleanEnv('ALLOW_DEV_SEED_ACCOUNTS', !isProtectedMode());
}

export function shouldBootstrapDemoData() {
  return readBooleanEnv('BOOTSTRAP_DEMO_DATA', true);
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.AUTH_SESSION_SECRET || '';
}

export function getMongoUri() {
  const uri = `${process.env.MONGODB_URI ?? ''}`.trim();

  if (!uri) {
    throw new Error('MONGODB_URI must be configured for the active app storage layer.');
  }

  return uri;
}

export function getMongoDbName() {
  return `${process.env.MONGODB_DB_NAME ?? 'mirror_progress'}`
    .trim()
    .replace(/\s+/g, '_');
}

export function getBootstrapAdmin() {
  const email = `${process.env.BOOTSTRAP_ADMIN_EMAIL ?? ''}`.trim();
  const password = `${process.env.BOOTSTRAP_ADMIN_PASSWORD ?? ''}`.trim();

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    name: `${process.env.BOOTSTRAP_ADMIN_NAME ?? 'Mirror Progress Admin'}`.trim(),
    company: `${process.env.BOOTSTRAP_ADMIN_COMPANY ?? 'Mirror Progress'}`.trim(),
  };
}

export function getAppAccessPassword() {
  return `${process.env.APP_ACCESS_PASSWORD ?? ''}`.trim();
}

export function shouldExposeLocalResetLinks() {
  return allowPasswordReset();
}

export function isProductionLikeRuntime() {
  return process.env.NODE_ENV === 'production' || isProtectedMode();
}

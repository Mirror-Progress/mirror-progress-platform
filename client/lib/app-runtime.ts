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

export function isDemoReadOnlyMode() {
  return readBooleanEnv('DEMO_MODE_READ_ONLY', false);
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

export function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.AUTH_SESSION_SECRET || '';
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

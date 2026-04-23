import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserRole, UserStatus } from './workspace-data';
import { getSessionSecret, isProductionLikeRuntime } from './app-runtime';

const SESSION_COOKIE = 'mirror_progress_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  clientId: string | null;
  assignedProjectIds: string[];
}

interface SessionPayload {
  user: SessionUser;
  exp: number;
}

const validRoles = new Set<UserRole>([
  'super_admin',
  'admin',
  'project_lead',
  'client',
]);

const validStatuses = new Set<UserStatus>(['active', 'disabled', 'invited']);

function getSecret() {
  const configuredSecret = getSessionSecret();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (isProductionLikeRuntime()) {
    throw new Error(
      'SESSION_SECRET or AUTH_SESSION_SECRET must be configured for protected or production deployments.'
    );
  }

  return 'mirror-progress-local-session-secret-change-me';
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url');
}

function signaturesMatch(signature: string, expectedSignature: string) {
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function serializeCookie(token: string, maxAge: number) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function parseCookieHeader(header?: string) {
  const cookies = new Map<string, string>();

  if (!header) {
    return cookies;
  }

  header.split(';').forEach((chunk) => {
    const [name, ...rest] = chunk.trim().split('=');

    if (!name || rest.length === 0) {
      return;
    }

    cookies.set(name, rest.join('='));
  });

  return cookies;
}

function normalizeRole(role?: string | null): UserRole {
  return role && validRoles.has(role as UserRole)
    ? (role as UserRole)
    : 'client';
}

function normalizeStatus(status?: string | null): UserStatus {
  return status && validStatuses.has(status as UserStatus)
    ? (status as UserStatus)
    : 'active';
}

export function normalizeSessionUser(
  user?: Partial<SessionUser> | null
): SessionUser | null {
  if (!user) {
    return null;
  }

  const id = `${user.id ?? ''}`.trim();
  const email = `${user.email ?? ''}`.trim();

  if (!id || !email) {
    return null;
  }

  const fallbackName = email.split('@')[0]?.trim() || 'Mirror Progress Account';

  return {
    id,
    name: `${user.name ?? ''}`.trim() || fallbackName,
    email,
    company: `${user.company ?? ''}`.trim() || 'Mirror Progress',
    role: normalizeRole(user.role),
    status: normalizeStatus(user.status),
    clientId:
      typeof user.clientId === 'string' && user.clientId.trim()
        ? user.clientId.trim()
        : null,
    assignedProjectIds: Array.isArray(user.assignedProjectIds)
      ? user.assignedProjectIds.filter(
          (projectId): projectId is string =>
            typeof projectId === 'string' && projectId.trim().length > 0
        )
      : [],
  };
}

export function getSessionUserFromCookieHeader(header?: string) {
  const cookies = parseCookieHeader(header);
  return verifySessionToken(cookies.get(SESSION_COOKIE));
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    user: normalizeSessionUser(user) ?? user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!signaturesMatch(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;

    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return normalizeSessionUser(payload.user);
  } catch {
    return null;
  }
}

export function getSessionUserFromRequest(req: NextApiRequest) {
  return getSessionUserFromCookieHeader(req.headers.cookie);
}

export function setSessionCookie(
  res: NextApiResponse,
  user: SessionUser
) {
  const token = createSessionToken(user);
  res.setHeader('Set-Cookie', serializeCookie(token, SESSION_TTL_SECONDS));
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', serializeCookie('', 0));
}

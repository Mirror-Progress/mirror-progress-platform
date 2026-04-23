import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const APP_ACCESS_COOKIE = 'mirror_progress_access';

const truthyValues = new Set(['1', 'true', 'yes', 'on']);

function readBoolean(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) {
    return fallback;
  }

  return truthyValues.has(value.trim().toLowerCase());
}

function getAppAccessPassword() {
  return `${process.env.APP_ACCESS_PASSWORD ?? ''}`.trim();
}

function isProtectedMode() {
  return readBoolean(process.env.APP_PROTECTED_MODE, false);
}

async function hashAccessPassword(password: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`mirror-progress-access:${password}`)
  );

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function isPublicPath(pathname: string) {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/workspace-assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/access' ||
    pathname === '/api/access'
  ) {
    return true;
  }

  return /\.[a-z0-9]+$/i.test(pathname);
}

export async function middleware(req: NextRequest) {
  if (!isProtectedMode() || isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const accessPassword = getAppAccessPassword();

  if (!accessPassword) {
    return NextResponse.redirect(new URL('/access', req.url));
  }

  const expectedToken = await hashAccessPassword(accessPassword);
  const currentToken = req.cookies.get(APP_ACCESS_COOKIE)?.value;

  if (currentToken === expectedToken) {
    return NextResponse.next();
  }

  const accessUrl = new URL('/access', req.url);
  accessUrl.searchParams.set('next', `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

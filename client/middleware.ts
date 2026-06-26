import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const APP_ACCESS_COOKIE = 'mirror_progress_access';
const CAMPAIGN_SURFACE = 'campaign';

const campaignCapabilityPaths = new Set([
  '/capabilities/proposal-intelligence',
  '/capabilities/operational-intelligence',
  '/capabilities/future-ready-infrastructure',
  '/capabilities/ai-readiness-audit',
]);

const campaignApiPaths = new Set([
  '/api/auth/session',
  '/api/sendMail',
  '/api/work',
]);

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

function getSiteSurface() {
  return `${process.env.SITE_SURFACE || process.env.NEXT_PUBLIC_SITE_SURFACE || ''}`
    .trim()
    .toLowerCase();
}

function isCampaignSurface() {
  return getSiteSurface() === CAMPAIGN_SURFACE;
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

function isStaticAssetPath(pathname: string) {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/workspace-assets') ||
    pathname === '/favicon.ico'
  ) {
    return true;
  }

  return /\.[a-z0-9]+$/i.test(pathname);
}

function isPublicPath(pathname: string) {
  if (isStaticAssetPath(pathname) || pathname === '/access' || pathname === '/api/access') {
    return true;
  }

  return false;
}

function isCampaignPublicPath(pathname: string) {
  if (isStaticAssetPath(pathname)) {
    return true;
  }

  if (pathname === '/' || pathname === '/research' || pathname.startsWith('/research/')) {
    return true;
  }

  if (campaignCapabilityPaths.has(pathname)) {
    return true;
  }

  if (campaignApiPaths.has(pathname)) {
    return true;
  }

  return false;
}

function hiddenNotFound() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export async function middleware(req: NextRequest) {
  if (isCampaignSurface() && !isCampaignPublicPath(req.nextUrl.pathname)) {
    return hiddenNotFound();
  }

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

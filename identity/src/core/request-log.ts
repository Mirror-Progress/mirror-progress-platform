import { PolicyError } from "./policy.js";

/**
 * One JSON log line per refused or failed request, so a failed sign-in, enrollment or reset leaves a
 * trace (reason code, route, status) instead of only a generic message in the person's browser.
 * Never logs bodies, query strings, headers, emails, IP addresses or exception text: path segments that
 * look like tokens or ids are replaced, and only PostgreSQL error/constraint codes are kept for 500s.
 */
const TOKEN_SEGMENT = /^[A-Za-z0-9_-]{20,}$|^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

export function loggableRoute(pathname: string): string {
  return pathname.split("/").map((segment) => (TOKEN_SEGMENT.test(segment) ? ":id" : segment)).join("/").slice(0, 160);
}

/** Health checks and static assets are not logged. */
export function loggedRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/internal/");
}

export type RefusalLog = { event: "identity_request_refused"; method: string; route: string; status: number;
  code?: string; dbCode?: string; constraint?: string };

export function refusalLog(method: string, pathname: string, status: number, error?: unknown): RefusalLog {
  const entry: RefusalLog = { event: "identity_request_refused", method, route: loggableRoute(pathname), status };
  if (error instanceof PolicyError) entry.code = error.code;
  else if (error !== undefined) {
    entry.code = "request_failed";
    const pg = error as { code?: unknown; constraint?: unknown };
    if (typeof pg.code === "string" && /^[0-9A-Z]{5}$/.test(pg.code)) entry.dbCode = pg.code;
    if (typeof pg.constraint === "string" && /^[a-z0-9_]{1,63}$/.test(pg.constraint)) entry.constraint = pg.constraint;
  }
  return entry;
}

export function logRefusal(method: string, pathname: string, status: number, error?: unknown): void {
  if (!loggedRoute(pathname) || status < 400) return;
  const entry = refusalLog(method, pathname, status, error);
  (status >= 500 ? console.error : console.warn)(JSON.stringify(entry));
}

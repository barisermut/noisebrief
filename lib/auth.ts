import crypto from "node:crypto";

/** Constant-time comparison; false when the expected secret is not configured. */
export function secretMatches(provided: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return secretMatches(
    request.headers.get("authorization") ?? "",
    secret ? `Bearer ${secret}` : undefined
  );
}

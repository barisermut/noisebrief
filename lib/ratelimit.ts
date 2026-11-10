import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

if (!redis) {
  console.error("Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing");
}

function limiter(requests: number, window: Duration, prefix: string): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `@upstash/ratelimit:${prefix}`,
    analytics: false,
  });
}

export const subscribeRatelimiter = limiter(3, "1 h", "subscribe");
export const unsubscribeRatelimiter = limiter(50, "1 m", "unsubscribe");

/** Returns true when the request is allowed (or rate limiting is not configured). */
export async function allowRequest(rl: Ratelimit | null, request: Request): Promise<boolean> {
  if (!rl) return true;
  const { success } = await rl.limit(getClientIp(request));
  return success;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

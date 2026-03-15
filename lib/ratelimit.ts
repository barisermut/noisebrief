import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisConfigured) {
  console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing");
}

function createRatelimiter() {
  if (!redisConfigured) {
    return null;
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per IP
    analytics: false,
  });
}

function createSubscribeRatelimiter() {
  if (!redisConfigured) {
    return null;
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 subscribe attempts per hour per IP
    analytics: false,
  });
}

function createUnsubscribeRatelimiter() {
  if (!redisConfigured) {
    return null;
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 m"),
    analytics: false,
  });
}

export const ratelimiter = createRatelimiter();
export const subscribeRatelimiter = createSubscribeRatelimiter();
export const unsubscribeRatelimiter = createUnsubscribeRatelimiter();

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/**
 * Feed cache: in-memory (always) + optional Redis (shared across serverless invocations).
 * TTL 5 min. When Redis env vars are set, cron can warm the cache and feed API reads from it.
 */

import { Redis } from "@upstash/redis";

const TTL_MS = 5 * 60 * 1000;
const TTL_SEC = Math.floor(TTL_MS / 1000);

const memory = new Map<string, { data: unknown; ts: number }>();

function memoryGet<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry || Date.now() - entry.ts > TTL_MS) return null;
  return entry.data as T;
}

function memorySet(key: string, data: unknown): void {
  memory.set(key, { data, ts: Date.now() });
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis !== null) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redis = Redis.fromEnv();
    return redis;
  } catch {
    return null;
  }
}

const CACHE_PREFIX = "pmradar:feed:";

async function redisGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(CACHE_PREFIX + key);
    return raw as T | null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, data: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(CACHE_PREFIX + key, data, { ex: TTL_SEC });
  } catch {
    // ignore
  }
}

/**
 * Get from cache (memory first, then Redis). On miss, run fetchFn, then set both and return.
 */
export async function cached<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const fromMemory = memoryGet<T>(key);
  if (fromMemory !== null) return fromMemory;

  const fromRedis = await redisGet<T>(key);
  if (fromRedis !== null) {
    memorySet(key, fromRedis);
    return fromRedis;
  }

  const data = await fetchFn();
  memorySet(key, data);
  await redisSet(key, data);
  return data;
}

/**
 * Set cache explicitly (for cron warming). Writes to both memory and Redis when available.
 */
export async function setCache(key: string, data: unknown): Promise<void> {
  memorySet(key, data);
  await redisSet(key, data);
}

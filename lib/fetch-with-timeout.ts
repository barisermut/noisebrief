/**
 * fetch with timeout. Aborts the request after ms milliseconds.
 * Use for external APIs to avoid hanging.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

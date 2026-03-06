# Codebase Audit: Performance & Bug Fixes

Audit date: 2025. Covers Performance (re-renders, API parallelization, images, animations, secrets, memory leaks, loading/CLS) and Bug Fixes (TypeScript, error handling, env fallbacks, API timeouts).

---

## 1. Performance

### 1.1 Re-renders — useMemo, useCallback, React.memo

| Location | Status | Notes |
|----------|--------|------|
| **Feed page** `filteredItems` | ✅ | Already wrapped in `useMemo` (items, searchQuery, sourceFilter). |
| **Feed page** `paginatedItems` | ✅ | Already wrapped in `useMemo` (filteredItems, page). |
| **Feed page** `toggleSource` | ✅ Fixed | Now wrapped in `useCallback` with empty deps to avoid new function each render. |
| **Feed page** `FeedCard` | ✅ Fixed | Wrapped in `React.memo` so parent re-renders don’t re-render cards when item/index/showScore are unchanged. |
| **Select page** `toggle`, `handleShowRadar` | ✅ | Already use `useCallback` with correct deps. |

### 1.2 API calls — parallelization

| Location | Status | Notes |
|----------|--------|------|
| **API route** `/api/feed` | ✅ | HN, Reddit, PH fetched with `Promise.all`. |
| **API route** AI path | ✅ | `summarizeBatch` and `getWeeklySummary` run in `Promise.all`. |
| **feed-sources** Reddit | ✅ Fixed | Was sequential `for` loop; now `Promise.all(REDDIT_SUBS.map(...))` then `flat()`. |
| **feed-sources** HN | ✅ | Item fetches already use `Promise.all(ids.slice(0, 50).map(...))`. |
| **lib/claude** `summarizeBatch` | ⚠️ Intentional | Chunks run sequentially to respect rate limits and avoid burning tokens; parallel would be possible but riskier. |

### 1.3 Images — Next.js &lt;Image&gt;, dimensions, lazy loading

| Location | Status | Notes |
|----------|--------|------|
| **Feed cards** | ✅ | Uses `next/image` with `width={36}` `height={36}`, `unoptimized={!isLocalLogo}` for Clearbit. |
| **next.config** | ✅ | `images.remotePatterns` includes `logo.clearbit.com`. |
| Lazy loading | ✅ | Next.js `Image` is lazy by default; card images are below the fold. |

### 1.4 Blocking main thread

| Item | Status | Notes |
|------|--------|------|
| Heavy sync work | ✅ | No large synchronous work on main thread; fetches and AI are async. |
| Typewriter effect | ✅ | Uses `setInterval` (30ms); cleanup with `clearInterval` in effect return. |

### 1.5 Framer Motion — GPU-friendly properties

| Location | Status | Notes |
|----------|--------|------|
| **Feed cards** | ✅ | `initial/animate` use `opacity` and `y` (transform). |
| **Select domain buttons** | ✅ | `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.98 }}` (transform). |
| **Landing / feed** | ✅ | Variants use `opacity`, `y`; no `width`/`height`/`top`/`left` in animations. |

### 1.6 Secrets &amp; client exposure

| Item | Status | Notes |
|------|--------|------|
| API keys | ✅ | `ANTHROPIC_API_KEY`, `PRODUCT_HUNT_API_KEY`, `CRON_SECRET` only used in server code (API routes, lib). |
| Client bundle | ✅ | No env vars with secrets in client; feed uses `/api/feed` only. |
| Console logs | ✅ | Only `console.warn` / `console.error` with error objects on server; no keys logged. Consider logging `err.message` only in production to avoid leaking stack. |

### 1.7 Memory leaks — listeners, timeouts, intervals

| Location | Status | Notes |
|----------|--------|------|
| **Feed page** typewriter | ✅ | `setInterval` id stored and cleared in effect cleanup (`return () => clearInterval(id)`). |
| **Feed page** fetch | ✅ Fixed | `AbortController` created in effect; `controller.abort()` in cleanup to cancel in-flight request and avoid setState after unmount. |
| Event listeners | ✅ | No manual `addEventListener` without matching `removeEventListener`. |

### 1.8 Loading states &amp; CLS

| Page | Status | Notes |
|------|--------|------|
| **Feed** | ✅ | Loading shows 6× `CardSkeleton` and “Loading feed…” when AI enabled; error state with Retry; empty states for no domains / no items / no search results. |
| **Feed** (Suspense) | ✅ | `Suspense` with skeleton fallback for `FeedContent` (useSearchParams). |
| **Select** | ✅ | No async load; no layout shift. |
| **Landing / Privacy** | ✅ | Static; no CLS concerns. |

---

## 2. Bug fixes

### 2.1 TypeScript — no implicit `any`

| Check | Status | Notes |
|-------|--------|------|
| Strict types | ✅ | No `: any` or `as any` in codebase. |
| API responses | ✅ | Feed response typed as `{ items?: FeedItem[]; weeklySummary?: string \| null }`. |
| lib/feed-sources | ✅ | Interfaces for HN, Reddit, PH responses; `RawFeedEntry` exported. |

### 2.2 Async error handling — try/catch

| Location | Status | Notes |
|----------|--------|------|
| **API route** GET | ✅ | Full handler in try/catch; 500 with generic message; per-source and AI failures caught and fallback. |
| **Cron route** | ✅ | try/catch returns 500 on failure. |
| **feed-sources** HN | ✅ | URL parsing in try/catch. |
| **feed-sources** Reddit | ✅ Fixed | Each sub in `Promise.all` wrapped in try/catch; failed sub returns `[]`. |
| **lib/claude** | ✅ | Per-chunk try/catch in `summarizeBatch`; `getWeeklySummary` caught in route. |
| **Feed page** fetch | ✅ | `.catch()` sets error state; AbortError ignored so no “Could not load” on unmount. |

### 2.3 Environment variables — fallbacks

| Variable | Status | Notes |
|----------|--------|------|
| `ANTHROPIC_API_KEY` | ✅ | Checked before AI path; missing → non-AI feed returned. |
| `PRODUCT_HUNT_API_KEY` | ✅ | Missing → `Promise.resolve([])` in feed and cron. |
| `CRON_SECRET` | ✅ | Missing or mismatch → 401. |

### 2.4 External API timeouts

| Location | Status | Notes |
|----------|--------|------|
| **lib/fetch-with-timeout** | ✅ Added | New helper: `fetchWithTimeout(input, { timeoutMs })` using `AbortController` + `setTimeout`. |
| **feed-sources** HN | ✅ Fixed | Uses `fetchWithTimeout` for topstories and each item (15s). |
| **feed-sources** Reddit | ✅ Fixed | Each sub uses `fetchWithTimeout` (15s). |
| **feed-sources** PH | ✅ Fixed | GraphQL request uses `fetchWithTimeout` (15s). |
| **Feed page** client fetch | ✅ | Uses native `fetch` with `AbortController` for cancel-on-unmount; no explicit timeout (same-origin API). |

---

## Summary of changes made

1. **Performance**  
   - **Feed:** `toggleSource` wrapped in `useCallback`; `FeedCard` wrapped in `React.memo`.  
   - **Feed:** Feed fetch uses `AbortController`; cleanup aborts on unmount and ignores `AbortError` in catch.  
   - **feed-sources:** Reddit fetches parallelized with `Promise.all(REDDIT_SUBS.map(...))`; each sub try/catch returns `[]` on failure.  
   - **feed-sources:** All external fetches (HN, Reddit, PH) use `fetchWithTimeout(..., { timeoutMs: 15_000 })`.

2. **Bug fixes / resilience**  
   - **lib/fetch-with-timeout.ts:** New module for timeout-backed fetch.  
   - **feed-sources:** Reddit per-sub try/catch so one bad sub doesn’t break the whole list.  
   - **API route:** Already had per-source and AI try/catch and fallbacks; no change needed.

3. **Already in good shape**  
   - No implicit `any`; env vars guarded; Framer uses transform/opacity; images use Next/Image with config; typewriter and feed fetch clean up correctly; loading and error states and CLS are handled.

---

## Optional follow-ups

- **Cron route:** Add timeout or per-source catch so one failing source doesn’t 500 the whole cron (same pattern as feed API).  
- **Production logging:** Log only `err.message` (or a code) in production to avoid leaking stack traces.  
- **Claude chunks:** If rate limits allow, consider parallelizing some `summarizeBatch` chunks (e.g. 2 in parallel) for speed; current sequential behavior is safe and intentional.

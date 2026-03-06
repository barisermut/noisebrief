import type { Domain, Source } from "@/types";
import { fetchWithTimeout } from "./fetch-with-timeout";

/** Decode common HTML entities and strip CDATA from RSS text */
function decodeRssText(s: string): string {
  let out = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  out = out
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
  return out;
}

/** Extract link URL from block: Atom <link href="..."/> or RSS <link>...</link> */
function extractLinkFromBlock(block: string): string {
  const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (hrefMatch) return decodeRssText(hrefMatch[1]);
  const innerMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return innerMatch ? decodeRssText(innerMatch[1]) : "";
}

/** Extract date from block: pubDate (RSS), published or updated (Atom) */
function extractDateFromBlock(block: string): Date {
  const pubDateMatch = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
  if (pubDateMatch) return new Date(decodeRssText(pubDateMatch[1]));
  const publishedMatch = block.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
  if (publishedMatch) return new Date(decodeRssText(publishedMatch[1]));
  const updatedMatch = block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
  if (updatedMatch) return new Date(decodeRssText(updatedMatch[1]));
  return new Date();
}

/**
 * Fetch subreddit via RSS (no OAuth). Reddit sometimes allows RSS from servers when JSON is blocked.
 * Reddit now serves Atom: <feed><entry><title/><link href="..."/><published/></entry></feed>.
 * We support both Atom <entry> and RSS 2.0 <item>.
 */
async function fetchSubredditViaRss(
  sub: string,
  domain: Domain,
  limit: number,
  userAgent: string
): Promise<RawFeedEntry[]> {
  const url = `https://www.reddit.com/r/${sub}/top/.rss?t=week`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: API_TIMEOUT_MS,
    headers: { "User-Agent": userAgent, Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items: RawFeedEntry[] = [];
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  function pushFromBlock(block: string): void {
    if (items.length >= limit) return;
    const titleMatch = block.match(titleRegex);
    const title = titleMatch ? decodeRssText(titleMatch[1]) : "";
    const link = extractLinkFromBlock(block);
    if (!title || !link) return;
    const pubDate = extractDateFromBlock(block);
    if (pubDate.getTime() < weekAgo) return;
    items.push({
      id: `reddit-rss-${sub}-${items.length}-${link.length}`,
      title,
      url: link,
      source: "Reddit" as const,
      sourceDomain: "reddit.com",
      tags: [domain],
      publishedAt: pubDate.toISOString(),
      description: title,
    });
  }

  // Atom: <entry>...</entry> (Reddit uses this)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRegex.exec(xml)) !== null) pushFromBlock(m[1]);
  // RSS 2.0: <item>...</item> (fallback)
  if (items.length === 0) {
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    while ((m = itemRegex.exec(xml)) !== null) pushFromBlock(m[1]);
  }
  if (items.length === 0 && res.ok) {
    console.warn(`Reddit RSS: 0 entries from r/${sub} (status ${res.status}). Check feed format (Atom vs RSS).`);
  }
  return items;
}

const API_TIMEOUT_MS = 15_000;

const HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = (id: number) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

export interface RawFeedEntry {
  id: string;
  title: string;
  url: string;
  source: Source;
  sourceDomain: string;
  tags: Domain[];
  publishedAt: string;
  upvotes?: number;
  description?: string;
}

export async function fetchHackerNews(limit: number): Promise<RawFeedEntry[]> {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const res = await fetchWithTimeout(HN_TOP, { timeoutMs: API_TIMEOUT_MS });
  const ids: number[] = await res.json();
  interface HNItem {
    id: number;
    title: string;
    url?: string;
    time: number;
    score?: number;
    type: string;
  }
  const items = await Promise.all(
    ids.slice(0, 50).map((id) =>
      fetchWithTimeout(HN_ITEM(id), { timeoutMs: API_TIMEOUT_MS }).then((r) => r.json() as Promise<HNItem>)
    )
  );
  const stories = items.filter(
    (i) => i && i.type === "story" && i.title && i.time * 1000 >= weekAgo
  );
  return stories.slice(0, limit).map((s) => {
    const url = s.url ?? `https://news.ycombinator.com/item?id=${s.id}`;
    let sourceDomain = "news.ycombinator.com";
    try {
      if (s.url) {
        const host = new URL(s.url).hostname.replace(/^www\./, "");
        if (host && host !== "news.ycombinator.com") sourceDomain = host;
      }
    } catch {
      // keep default
    }
    return {
      id: `hn-${s.id}`,
      title: s.title,
      url,
      source: "HackerNews" as const,
      sourceDomain,
      tags: [],
      publishedAt: new Date(s.time * 1000).toISOString(),
      upvotes: s.score,
      description: s.title,
    };
  });
}

const REDDIT_SUBS: { sub: string; domain: Domain }[] = [
  // Product Management
  { sub: "productmanagement", domain: "Product" },
  { sub: "product_management", domain: "Product" },
  // AI & LLMs
  { sub: "artificial", domain: "AI" },
  { sub: "MachineLearning", domain: "AI" },
  { sub: "LocalLLaMA", domain: "AI" },
  { sub: "ChatGPT", domain: "AI" },
  { sub: "singularity", domain: "AI" },
  // SaaS & Startups
  { sub: "SaaS", domain: "SaaS" },
  { sub: "startups", domain: "SaaS" },
  { sub: "Entrepreneur", domain: "SaaS" },
  // Dev Tools
  { sub: "programming", domain: "DevTools" },
  { sub: "webdev", domain: "DevTools" },
  { sub: "devops", domain: "DevTools" },
  // Design
  { sub: "UXDesign", domain: "Design" },
  { sub: "userexperience", domain: "Design" },
  // Growth & Marketing
  { sub: "growth_hacking", domain: "Growth" },
  { sub: "digital_marketing", domain: "Growth" },
];

/** Reddit RSS: use a descriptive User-Agent. */
function getRedditUserAgent(): string {
  return (
    process.env.REDDIT_USER_AGENT ??
    "web:pmradar:v1 (by /u/pmradar)"
  );
}

const REDDIT_MAX_SUBS_TOTAL = 6;

/**
 * Pick up to 6 subreddits based on selected domains:
 * - 1 category → 6 subs from that category
 * - 2 categories → 3 subs per category
 * - 3+ categories → 2 subs per category
 * - 0 categories → first 6 from list (fallback)
 */
function pickRedditSubsForDomains(selectedDomains: Domain[]): { sub: string; domain: Domain }[] {
  const maxTotal = REDDIT_MAX_SUBS_TOTAL;
  if (selectedDomains.length === 0) {
    return REDDIT_SUBS.slice(0, maxTotal);
  }
  const perCategory =
    selectedDomains.length === 1 ? 6 : selectedDomains.length === 2 ? 3 : 2;
  const out: { sub: string; domain: Domain }[] = [];
  for (const domain of selectedDomains) {
    const forDomain = REDDIT_SUBS.filter((r) => r.domain === domain).slice(0, perCategory);
    out.push(...forDomain);
    if (out.length >= maxTotal) break;
  }
  return out.slice(0, maxTotal);
}

export async function fetchReddit(
  limitPerSub: number,
  selectedDomains: Domain[] = []
): Promise<RawFeedEntry[]> {
  const userAgent = getRedditUserAgent();
  const subsToFetch = pickRedditSubsForDomains(selectedDomains);
  const results = await Promise.all(
    subsToFetch.map(({ sub, domain }) =>
      fetchSubredditViaRss(sub, domain, limitPerSub, userAgent)
    )
  );
  return results.flat();
}

const PH_GRAPHQL = "https://api.producthunt.com/v2/api/graphql";

const PH_POSTS_QUERY = `
  query Posts($first: Int!) {
    posts(first: $first) {
      edges {
        node {
          id
          name
          tagline
          url
          votesCount
          createdAt
        }
      }
    }
  }
`;

export async function fetchProductHunt(
  apiKey: string,
  limit: number
): Promise<RawFeedEntry[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetchWithTimeout(PH_GRAPHQL, {
    timeoutMs: API_TIMEOUT_MS,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: PH_POSTS_QUERY,
      variables: { first: 30 },
    }),
  });
  interface PHNode {
    id: string;
    name: string;
    tagline?: string;
    url?: string;
    votesCount?: number;
    createdAt?: string;
  }
  interface PHResponse {
    data?: { posts?: { edges?: Array<{ node?: PHNode }> } };
    errors?: Array<{ message?: string }>;
  }
  const json: PHResponse = await res.json();
  if (!res.ok) {
    console.warn(`Product Hunt API returned ${res.status}. Check PRODUCT_HUNT_API_KEY in Vercel env.`);
    return [];
  }
  if (json.errors?.length) {
    console.warn("Product Hunt GraphQL errors:", json.errors.map((e) => e.message).join("; "));
    return [];
  }
  const edges = json?.data?.posts?.edges ?? [];
  const out: RawFeedEntry[] = [];
  for (const e of edges) {
    const n = e?.node;
    if (!n || !n.name || (n.createdAt && n.createdAt < weekAgo)) continue;
    out.push({
      id: `ph-${n.id}`,
      title: n.name,
      url: n.url ?? `https://www.producthunt.com/posts/${n.name.toLowerCase().replace(/\s+/g, "-")}`,
      source: "ProductHunt" as const,
      sourceDomain: "producthunt.com",
      tags: [],
      publishedAt: n.createdAt ?? new Date().toISOString(),
      upvotes: n.votesCount,
      description: n.tagline ?? n.name,
    });
    if (out.length >= limit) break;
  }
  return out;
}

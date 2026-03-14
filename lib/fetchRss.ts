import Parser from "rss-parser";
import type { Source } from "@/types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Noisebrief/1.0" },
});

const REDDIT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Noisebrief/1.0; +https://www.noisebrief.com)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
} as const;

export interface RssItem {
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
}

function isRedditUrl(url: string): boolean {
  return url.includes("reddit.com");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

const DEFAULT_HEADERS = { "User-Agent": "Noisebrief/1.0" } as const;
const FETCH_TIMEOUT = 10_000;
const MS_48_HOURS = 48 * 60 * 60 * 1000;

async function fetchXml(url: string, sourceName: string): Promise<string | null> {
  const headers = isRedditUrl(url) ? REDDIT_HEADERS : DEFAULT_HEADERS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 0 },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[${sourceName}] failed: HTTP ${response.status}`);
      }
      return null;
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRssFeed(
  url: string,
  sourceName: string,
  domain: string
): Promise<Source[]> {
  if (process.env.NODE_ENV === "development") {
    console.log(`Fetching ${sourceName}...`);
  }
  try {
    const xml = await fetchXml(url, sourceName);
    if (!xml) return [];

    const feed = await parser.parseString(xml);
    const items = (feed.items ?? []) as RssItem[];

    const reddit = isRedditUrl(url);
    const cutoff = Date.now() - MS_48_HOURS;

    const mapped = items
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: decodeHtmlEntities(item.title ?? "").trim(),
        url: item.link!.trim(),
        sourceName,
        domain,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      }));

    const filtered = reddit
      ? mapped.filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
      : mapped;

    const result = [...filtered]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, reddit ? 5 : 10);

    if (process.env.NODE_ENV === "development") {
      console.log(`[${sourceName}] returned ${result.length} items`);
    }
    return result;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[${sourceName}] failed:`, err);
    }
    return [];
  }
}

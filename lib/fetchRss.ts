import Parser from "rss-parser";
import type { Source } from "@/types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Noisebrief/1.0" },
});

const REDDIT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Noisebrief/1.0; +https://noisebrief.vercel.app)",
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

export async function fetchRssFeed(
  url: string,
  sourceName: string,
  domain: string
): Promise<Source[]> {
  if (process.env.NODE_ENV === "development") {
    console.log(`Fetching ${sourceName}...`);
  }
  try {
    let items: RssItem[];
    if (isRedditUrl(url)) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let response: Response;
      try {
        response = await fetch(url, {
          headers: REDDIT_HEADERS,
          next: { revalidate: 0 },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        console.error(`[${sourceName}] failed: HTTP ${response.status}`);
        return [];
      }
      const xml = await response.text();
      const feed = await parser.parseString(xml);
      items = (feed.items ?? []) as RssItem[];
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { "User-Agent": "Noisebrief/1.0" },
          next: { revalidate: 0 },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        console.error(`[${sourceName}] failed: HTTP ${response.status}`);
        return [];
      }
      const xml = await response.text();
      const feed = await parser.parseString(xml);
      items = (feed.items ?? []) as RssItem[];
    }
    const MS_48_HOURS = 48 * 60 * 60 * 1000;
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

    // Reddit: 48h filter then sort by newest; limit 5 per sub. Non-Reddit: 10 per source.
    const filtered =
      isRedditUrl(url) ?
        mapped.filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
      : mapped;

    const limit = isRedditUrl(url) ? 5 : 10;
    const result = [...filtered]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
    if (process.env.NODE_ENV === "development") {
      console.log(`[${sourceName}] returned ${result.length} items`);
    }
    return result;
  } catch (err) {
    console.error(`[${sourceName}] failed:`, err);
    return [];
  }
}

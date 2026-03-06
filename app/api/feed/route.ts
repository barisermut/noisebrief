import { NextRequest, NextResponse } from "next/server";
import { fetchHackerNews, fetchReddit, fetchProductHunt } from "@/lib/feed-sources";
import { cached } from "@/lib/feed-cache";
import { summarizeBatch, getWeeklySummary } from "@/lib/claude";
import type { Domain, FeedItem, Source } from "@/types";

const MAX_ITEMS = 20;
const MIN_AI_SCORE = 4;
const DOMAIN_OPTIONS: Domain[] = [
  "AI",
  "SaaS",
  "Product",
  "Fintech",
  "DevTools",
  "Design",
  "Growth",
];

function parseDomains(domainsParam: string | null): Domain[] {
  if (!domainsParam) return [];
  const parts = domainsParam.split(",").map((s) => s.trim());
  const out: Domain[] = [];
  for (const p of parts) {
    const d = DOMAIN_OPTIONS.find(
      (x) => x.toLowerCase() === p.toLowerCase() || x.replace(/\s/g, "") === p.replace(/\s/g, "")
    );
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
}

function sourceLabel(s: Source): string {
  return s === "HackerNews" ? "Hacker News" : s === "ProductHunt" ? "Product Hunt" : "Reddit";
}

export async function GET(request: NextRequest) {
  try {
    const domainsParam = request.nextUrl.searchParams.get("domains");
    const useAi = request.nextUrl.searchParams.get("ai") !== "0";
    const selectedDomains = parseDomains(domainsParam);

    const [hn, reddit, ph] = await Promise.all([
      cached("hn", () => fetchHackerNews(8)).catch((err) => {
        console.warn("Feed API: Hacker News fetch failed", err);
        return [] as Awaited<ReturnType<typeof fetchHackerNews>>;
      }),
      cached(`reddit-${[...selectedDomains].sort().join(",")}`, () =>
        fetchReddit(5, selectedDomains)
      ).catch((err) => {
        console.warn("Feed API: Reddit fetch failed", err);
        return [] as Awaited<ReturnType<typeof fetchReddit>>;
      }),
      process.env.PRODUCT_HUNT_API_KEY
        ? cached("ph", () => fetchProductHunt(process.env.PRODUCT_HUNT_API_KEY!, 7)).catch((err) => {
            console.warn("Feed API: Product Hunt fetch failed", err);
            return [] as Awaited<ReturnType<typeof fetchProductHunt>>;
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof fetchProductHunt>>),
    ]);

    const combined = [...hn, ...reddit, ...ph]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, MAX_ITEMS);

    if (combined.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    /** When AI is off: use first sentences from source (description/tagline or title), shown with ellipsis after 2–3 lines on the card. */
    function fallbackSummary(entry: (typeof combined)[0]): string {
      const desc = entry.description?.trim();
      if (desc && desc !== entry.title) return desc;
      return entry.title;
    }

    function scoreFromUpvotes(entry: (typeof combined)[0]): number {
      const up = entry.upvotes ?? 0;
      if (up <= 0) return 5;
      const maxUp = Math.max(...combined.map((e) => e.upvotes ?? 0), 1);
      return Math.min(10, Math.max(1, Math.round((up / maxUp) * 9) + 1));
    }

    function tagsForEntry(entry: (typeof combined)[0]): Domain[] {
      if (entry.tags.length > 0) return entry.tags;
      return selectedDomains.length > 0 ? selectedDomains.slice(0, 3) : [];
    }

    function buildItemsWithoutAi(): FeedItem[] {
      return combined.map((e) => ({
        id: e.id,
        title: e.title,
        url: e.url,
        source: e.source,
        sourceDomain: e.sourceDomain,
        summary: fallbackSummary(e),
        tags: tagsForEntry(e),
        relevanceScore: scoreFromUpvotes(e),
        publishedAt: e.publishedAt,
        upvotes: e.upvotes,
      }));
    }

    if (!apiKey || !useAi) {
      return NextResponse.json({ items: buildItemsWithoutAi(), weeklySummary: null });
    }

    let summaries: Awaited<ReturnType<typeof import("@/lib/claude").summarizeBatch>>;
    let weeklySummary: string | null = null;
    try {
      [summaries, weeklySummary] = await Promise.all([
        summarizeBatch(apiKey, combined, selectedDomains),
        getWeeklySummary(
          apiKey,
          combined.map((e) => e.title),
          combined.map((e) => sourceLabel(e.source))
        ).catch(() => null),
      ]);
    } catch (aiErr) {
      console.warn("Feed API: AI summarization failed, falling back to non-AI feed", aiErr);
      return NextResponse.json({ items: buildItemsWithoutAi(), weeklySummary: null });
    }

    const items: FeedItem[] = combined.map((e, i) => {
      const s = summaries[i];
      const tags = (s?.tags?.length ? s.tags : e.tags.length ? e.tags : selectedDomains.length ? selectedDomains.slice(0, 3) : []) as Domain[];
      const raw = s?.summary ?? fallbackSummary(e);
      const summary = raw.trim() && raw !== e.title ? raw : fallbackSummary(e);
      return {
        id: e.id,
        title: e.title,
        url: e.url,
        source: e.source,
        sourceDomain: e.sourceDomain,
        summary,
        tags,
        relevanceScore: s?.relevanceScore ?? scoreFromUpvotes(e),
        publishedAt: e.publishedAt,
        upvotes: e.upvotes,
      };
    });

    const byScore = items.filter((i) => i.relevanceScore >= MIN_AI_SCORE);
    const sourcesInFeed = new Set(combined.map((e) => e.source));
    const kept = new Set(byScore.map((i) => i.id));
    for (const source of sourcesInFeed) {
      const fromSource = byScore.filter((i) => i.source === source);
      if (fromSource.length > 0) continue;
      const fallbackFromSource = items
        .filter((i) => i.source === source)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);
      for (const item of fallbackFromSource) {
        if (!kept.has(item.id)) {
          kept.add(item.id);
          byScore.push(item);
        }
      }
    }
    byScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ items: byScore, weeklySummary });
  } catch (err) {
    console.error("Feed API error:", err);
    return NextResponse.json(
      { error: "Failed to load feed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchHackerNews, fetchReddit, fetchProductHunt } from "@/lib/feed-sources";
import { setCache } from "@/lib/feed-cache";
import type { Domain } from "@/types";

const CRON_SECRET = process.env.CRON_SECRET;

/** Domain combinations to warm for Reddit (same keys the feed API uses). */
const REDDIT_WARM_DOMAINS: Domain[][] = [[], ["AI"], ["SaaS"], ["Product"]];

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret =
    auth?.startsWith("Bearer ") ? auth.slice(7) : request.headers.get("CRON_SECRET") ?? "";

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Same limits as feed API so cached data is usable as-is
    const hnLimit = 8;
    const redditLimitPerSub = 5;
    const phLimit = 7;

    const redditKeys = REDDIT_WARM_DOMAINS.map(
      (d) => `reddit-${[...d].sort().join(",")}`
    );

    const results = await Promise.allSettled([
      fetchHackerNews(hnLimit).then((data) => setCache("hn", data)),
      ...REDDIT_WARM_DOMAINS.map((domains) =>
        fetchReddit(redditLimitPerSub, domains).then((data) => {
          const key = `reddit-${[...domains].sort().join(",")}`;
          return setCache(key, data);
        })
      ),
      ...(process.env.PRODUCT_HUNT_API_KEY
        ? [
            fetchProductHunt(process.env.PRODUCT_HUNT_API_KEY, phLimit).then(
              (data) => setCache("ph", data)
            ),
          ]
        : []),
    ]);

    const warmed = ["hn", ...redditKeys, ...(process.env.PRODUCT_HUNT_API_KEY ? ["ph"] : [])];
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      failed.forEach((r) =>
        console.warn("Cron warm failed:", (r as PromiseRejectedResult).reason)
      );
    }

    return NextResponse.json({
      ok: true,
      warmed,
      succeeded,
      failed: failed.length,
      message:
        "Feed cache warmed. Next feed requests will use Redis (if configured) or in-memory cache.",
    });
  } catch (err) {
    console.error("Cron refresh error:", err);
    return NextResponse.json(
      { error: "Refresh failed" },
      { status: 500 }
    );
  }
}

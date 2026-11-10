import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth";
import { isPublishableBrief } from "@/lib/brief-guard";
import { fetchAllSources } from "@/lib/fetchAllSources";
import { generateDailySummary } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runDigest } from "@/lib/runDigest";
import { getTodayDateString } from "@/lib/date";
import type { Source } from "@/types";
import type { Json } from "@/types/supabase";

// Brief + digest in one run; digest can take time with many subscribers.
export const maxDuration = 120;

/** Extract URLs from yesterday's brief sources for deduplication. */
async function getYesterdayBriefUrls(): Promise<Set<string>> {
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await getSupabaseAdmin()
    .from("daily_briefs")
    .select("sources")
    .eq("date", yesterdayDate)
    .maybeSingle();
  if (!data?.sources || !Array.isArray(data.sources)) return new Set();
  const urls = new Set<string>();
  for (const s of data.sources as Array<{ url?: string }>) {
    if (typeof s?.url === "string") urls.add(s.url);
  }
  return urls;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch sources and yesterday's URLs in parallel — they're independent.
    const [sourcesResult, yesterdayUrlsResult] = await Promise.all([
      fetchAllSources().catch((err) => {
        console.error("Cron error after RSS fetch", err);
        throw err;
      }),
      getYesterdayBriefUrls().catch(() => new Set<string>()),
    ]);

    const sources = sourcesResult;

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No sources fetched" },
        { status: 502 }
      );
    }

    const yesterdayUrls = yesterdayUrlsResult;
    let sourcesToUse = sources.filter(
      (s: Source) => !yesterdayUrls.has(s.url)
    );
    if (sourcesToUse.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn("All sources duplicated from yesterday, using full list");
      }
      sourcesToUse = sources;
    }

    let result: Awaited<ReturnType<typeof generateDailySummary>>;
    try {
      result = await generateDailySummary(sourcesToUse);
    } catch (err) {
      console.error("Cron error after Claude API call", err);
      throw new Error("Claude API failed");
    }
    const { title, summary, paragraphs, usedSources } = result;

    if (!isPublishableBrief(title, paragraphs)) {
      console.error("Cron rejected unpublishable brief");
      throw new Error("Generated brief failed publish guard");
    }

    const today = getTodayDateString();
    const { error: upsertError } = await getSupabaseAdmin()
      .from("daily_briefs")
      .upsert(
        { date: today, title, summary, paragraphs: paragraphs as unknown as Json, sources: usedSources as unknown as Json },
        { onConflict: "date" }
      );
    if (upsertError) {
      console.error("Supabase upsert error", upsertError);
      return NextResponse.json({ error: "Failed to store brief" }, { status: 500 });
    }

    // Publish the new brief right away instead of waiting for the ISR window.
    revalidatePath("/");
    revalidatePath("/brief/[date]", "page");
    revalidatePath("/sitemap.xml");

    // Run digest immediately after brief so order is guaranteed (Vercel Hobby cron window).
    const digestResult = await runDigest();

    return NextResponse.json({
      ok: true,
      date: today,
      summaryLength: summary.length,
      sourcesCount: usedSources.length,
      digest:
        digestResult.ok
          ? { sent: digestResult.sent, failed: digestResult.failed }
          : { message: digestResult.reason },
    });
  } catch (err) {
    console.error("Cron error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

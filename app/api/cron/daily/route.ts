import { NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/fetchAllSources";
import { generateDailySummary } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Source } from "@/types";

export const maxDuration = 60;

/** Extract URLs from yesterday's brief sources for deduplication. */
async function getYesterdayBriefUrls(): Promise<Set<string>> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().slice(0, 10);
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
  // Vercel Cron: send Authorization: Bearer <CRON_SECRET>; validate before any work.
  const cronSecret = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (cronSecret !== expected || !process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch sources and yesterday's URLs in parallel — they're independent.
    const [sourcesResult, yesterdayUrlsResult] = await Promise.all([
      fetchAllSources().catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Cron error after RSS fetch");
        }
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

    let title: string;
    let summary: string;
    let paragraphs: Awaited<ReturnType<typeof generateDailySummary>>["paragraphs"];
    let usedSources: Awaited<ReturnType<typeof generateDailySummary>>["usedSources"];
    try {
      const result = await generateDailySummary(sourcesToUse);
      title = result.title;
      summary = result.summary;
      paragraphs = result.paragraphs;
      usedSources = result.usedSources;
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.error("Cron error after Claude API call");
      }
      throw new Error("Claude API failed");
    }

    const today = new Date().toISOString().slice(0, 10);

    let supabaseError: { message: string } | null = null;
    try {
      const table = getSupabaseAdmin().from("daily_briefs");
      type UpsertPayload = {
        date: string;
        title: string;
        summary: string;
        paragraphs: unknown;
        sources: unknown;
      };
      const result = await (table.upsert as (v: UpsertPayload, o: { onConflict: string }) => ReturnType<typeof table.upsert>)(
        { date: today, title, summary, paragraphs, sources: usedSources },
        { onConflict: "date" }
      );
      supabaseError = result.error;
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.error("Cron error after Supabase insert");
      }
      throw new Error("Supabase insert failed");
    }

    if (supabaseError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Supabase upsert error");
      }
      return NextResponse.json(
        { error: "Failed to store brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      date: today,
      summaryLength: summary.length,
      sourcesCount: usedSources.length,
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("Cron error");
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

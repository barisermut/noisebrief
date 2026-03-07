import { NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/fetchAllSources";
import { generateDailySummary } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel Cron: send Authorization: Bearer <CRON_SECRET>; validate before any work.
  const cronSecret = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (cronSecret !== expected || !process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let sources: Awaited<ReturnType<typeof fetchAllSources>>;
    try {
      sources = await fetchAllSources();
    } catch {
      console.error("Cron error after RSS fetch");
      throw new Error("RSS fetch failed");
    }

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No sources fetched" },
        { status: 502 }
      );
    }

    let title: string;
    let summary: string;
    let paragraphs: string[];
    let usedSources: Awaited<ReturnType<typeof generateDailySummary>>["usedSources"];
    try {
      const result = await generateDailySummary(sources);
      title = result.title;
      summary = result.summary;
      paragraphs = result.paragraphs;
      usedSources = result.usedSources;
    } catch {
      console.error("Cron error after Claude API call");
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
      console.error("Cron error after Supabase insert");
      throw new Error("Supabase insert failed");
    }

    if (supabaseError) {
      console.error("Supabase upsert error");
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
    console.error("Cron error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

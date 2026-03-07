import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Source } from "@/types";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const admin = getSupabaseAdmin();

    // 1. Try today's brief first
    const { data: todayData, error: todayError } = await admin
      .from("daily_briefs")
      .select("date, title, summary, paragraphs, sources, created_at")
      .eq("date", today)
      .maybeSingle();

    if (!todayError && todayData) {
      const row = todayData as {
        date: string;
        title: string | null;
        summary: string;
        paragraphs: unknown;
        sources: unknown;
        created_at: string;
      };
      const paras = Array.isArray(row.paragraphs)
        ? (row.paragraphs as string[])
        : row.summary
          ? [row.summary]
          : [];
      return NextResponse.json({
        title: row.title ?? "",
        summary: row.summary,
        paragraphs: paras,
        sources: (row.sources as Source[]) ?? [],
        generatedAt: row.created_at,
        date: row.date,
        isFallback: false,
      });
    }

    // 2. Fallback: most recent brief (ORDER BY date DESC LIMIT 1)
    const { data: latestData, error: latestError } = await admin
      .from("daily_briefs")
      .select("date, title, summary, paragraphs, sources, created_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestError && latestData) {
      const row = latestData as {
        date: string;
        title: string | null;
        summary: string;
        paragraphs: unknown;
        sources: unknown;
        created_at: string;
      };
      const paras = Array.isArray(row.paragraphs)
        ? (row.paragraphs as string[])
        : row.summary
          ? [row.summary]
          : [];
      return NextResponse.json({
        title: row.title ?? "",
        summary: row.summary,
        paragraphs: paras,
        sources: (row.sources as Source[]) ?? [],
        generatedAt: row.created_at,
        date: row.date,
        isFallback: true,
      });
    }

    // 3. No briefs in the database at all
    return NextResponse.json({
      title: null,
      summary: null,
      paragraphs: [],
      sources: [],
      generatedAt: null,
      date: null,
      isFallback: false,
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("Brief today error");
    }
    return NextResponse.json(
      {
        title: null,
        summary: null,
        paragraphs: [],
        sources: [],
        generatedAt: null,
        date: null,
        isFallback: false,
      },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Source } from "@/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  if (!date || !isValidDateString(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("daily_briefs")
      .select("date, title, summary, paragraphs, sources, created_at")
      .eq("date", date)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Brief [date] query error:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch brief." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No brief found for this date." },
        { status: 404 }
      );
    }

    const row = data as {
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
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("Brief [date] error");
    }
    return NextResponse.json(
      { error: "Failed to fetch brief." },
      { status: 500 }
    );
  }
}

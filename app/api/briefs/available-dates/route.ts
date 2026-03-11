import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Returns all dates that have a brief, sorted descending (newest first).
 * Powers the date picker — only these dates are selectable.
 */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("daily_briefs")
      .select("date")
      .order("date", { ascending: false })
      .limit(365);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Available dates query error:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch available dates." },
        { status: 500 }
      );
    }

    const dates = (data ?? [])
      .map((row: { date: string }) => row.date)
      .filter((d): d is string => typeof d === "string" && d.length > 0);

    return NextResponse.json({ dates });
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("Available dates error");
    }
    return NextResponse.json(
      { error: "Failed to fetch available dates." },
      { status: 500 }
    );
  }
}

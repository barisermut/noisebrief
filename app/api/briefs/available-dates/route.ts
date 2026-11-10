import { NextResponse } from "next/server";
import { getAvailableDates } from "@/lib/brief-server";

/** All dates that have a brief, newest first. Powers the date picker. */
export async function GET() {
  try {
    const dates = await getAvailableDates();
    return NextResponse.json(
      { dates },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    console.error("Available dates error", err);
    return NextResponse.json({ error: "Failed to fetch available dates." }, { status: 500 });
  }
}

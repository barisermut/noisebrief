import { NextResponse } from "next/server";
import { getBriefByDate } from "@/lib/brief-server";
import { isValidDateString } from "@/lib/date";

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const brief = await getBriefByDate(date);
    if (!brief) {
      return NextResponse.json({ error: "No brief found for this date." }, { status: 404 });
    }
    return NextResponse.json(brief, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("Brief [date] error", err);
    return NextResponse.json({ error: "Failed to fetch brief." }, { status: 500 });
  }
}

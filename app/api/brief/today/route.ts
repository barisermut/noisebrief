import { NextResponse } from "next/server";
import { getLatestBrief } from "@/lib/brief-server";

/** Latest brief (today's, or the most recent one with `isFallback: true`). */
export async function GET() {
  try {
    const brief = await getLatestBrief();
    return NextResponse.json(
      brief ?? {
        title: null,
        summary: "",
        paragraphs: [],
        sources: [],
        generatedAt: null,
        date: null,
        isFallback: false,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    console.error("Brief today error", err);
    return NextResponse.json({ error: "Failed to load brief" }, { status: 500 });
  }
}

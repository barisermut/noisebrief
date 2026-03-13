import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  extractKeywordForBackfill,
  validateParagraphs,
} from "@/lib/claude";
import type { BriefParagraph } from "@/types/brief";
import type { Source } from "@/types";
import type { Json } from "@/types/supabase";

const BACKFILL_RATE_LIMIT_MS = 1000;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (auth !== expected || !process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let processed = 0;
  let skipped = 0;

  try {
    const { data: rows, error: fetchError } = await getSupabaseAdmin()
      .from("daily_briefs")
      .select("date, paragraphs, sources")
      .order("date", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch briefs", processed: 0, skipped: 0, errors: [fetchError.message] },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0, errors: [] });
    }

    const toProcess = rows.filter(
      (row: { paragraphs: unknown }) =>
        Array.isArray(row.paragraphs) &&
        row.paragraphs.length > 0 &&
        typeof row.paragraphs[0] === "string"
    );

    skipped = rows.length - toProcess.length;

    type Row = { date: string; paragraphs: string[]; sources: unknown };
    for (const row of toProcess as unknown as Row[]) {
      try {
        const sources = (Array.isArray(row.sources) ? row.sources : []) as Source[];
        const validUrls = sources.map((s) => s.url);
        const sourcesList = sources.map((s) => ({ title: s.title, url: s.url }));

        const rawParagraphs: BriefParagraph[] = [];
        for (const text of row.paragraphs) {
          const keywords = await extractKeywordForBackfill(text, sourcesList);
          rawParagraphs.push({ text, keywords });
        }

        const validated = validateParagraphs(rawParagraphs, validUrls);

        const { error: updateError } = await getSupabaseAdmin()
          .from("daily_briefs")
          .update({ paragraphs: validated as unknown as Json })
          .eq("date", row.date);

        if (updateError) {
          errors.push(`${row.date}: ${updateError.message}`);
          continue;
        }

        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${row.date}: ${message}`);
      }

      await new Promise((r) => setTimeout(r, BACKFILL_RATE_LIMIT_MS));
    }

    return NextResponse.json({
      processed,
      skipped,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Backfill failed",
        processed,
        skipped,
        errors: [...errors, message],
      },
      { status: 500 }
    );
  }
}

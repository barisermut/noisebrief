import { cache } from "react";
import { normalizeBriefRowFields } from "@/lib/brief-row";
import { getSupabaseAdmin } from "@/lib/supabase";

export type BriefMeta = {
  date: string;
  title: string | null;
  summary: string;
};

/**
 * Fetches a brief by date (title + summary only). Cached per-request so
 * generateMetadata and the page component share one Supabase call.
 */
export const getBriefByDate = cache(async (date: string): Promise<BriefMeta | null> => {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("daily_briefs")
      .select("date, title, summary")
      .eq("date", date)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as BriefMeta;
    const n = normalizeBriefRowFields({
      title: row.title,
      summary: row.summary,
      paragraphs: [],
    });
    return { date: row.date, title: n.title, summary: n.summary };
  } catch {
    return null;
  }
});

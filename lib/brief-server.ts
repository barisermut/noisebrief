import { cache } from "react";
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
    return data as BriefMeta;
  } catch {
    return null;
  }
});

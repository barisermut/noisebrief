import "server-only";
import { cache } from "react";
import { BRIEF_COLUMNS, briefFromRow, type BriefData } from "@/lib/brief-row";
import { getTodayDateString } from "@/lib/date";
import { getSupabasePublic } from "@/lib/supabase";

/** Brief for one date, or null. Cached per request so metadata and page share one query. */
export const getBriefByDate = cache(async (date: string): Promise<BriefData | null> => {
  const { data, error } = await getSupabasePublic()
    .from("daily_briefs")
    .select(BRIEF_COLUMNS)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? briefFromRow(data) : null;
});

/** Most recent brief; `isFallback` is true when it is not today's. */
export const getLatestBrief = cache(async (): Promise<BriefData | null> => {
  const { data, error } = await getSupabasePublic()
    .from("daily_briefs")
    .select(BRIEF_COLUMNS)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? briefFromRow(data, data.date !== getTodayDateString()) : null;
});

/** All dates that have a brief, newest first. */
export const getAvailableDates = cache(async (limit = 5000): Promise<string[]> => {
  const { data, error } = await getSupabasePublic()
    .from("daily_briefs")
    .select("date")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => r.date).filter((d): d is string => typeof d === "string" && d.length > 0);
});

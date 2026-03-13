import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const home: MetadataRoute.Sitemap[0] = {
    url: base,
    changeFrequency: "daily",
    priority: 1.0,
  };

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("daily_briefs")
      .select("date")
      .order("date", { ascending: false })
      .limit(365);

    if (error || !data) return [home];

    const briefs: MetadataRoute.Sitemap = (data as { date: string }[])
      .map((row) => row.date)
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .map((date) => ({
        url: `${base}/brief/${date}`,
        lastModified: new Date(date + "T12:00:00Z"),
        changeFrequency: "never" as const,
        priority: 0.7,
      }));

    return [home, ...briefs];
  } catch {
    return [home];
  }
}

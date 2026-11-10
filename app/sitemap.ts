import type { MetadataRoute } from "next";
import { getAvailableDates } from "@/lib/brief-server";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let dates: string[] = [];
  try {
    dates = await getAvailableDates();
  } catch (err) {
    console.error("Sitemap dates error", err);
  }
  return [
    {
      url: base,
      lastModified: dates[0] ? new Date(dates[0] + "T08:00:00Z") : undefined,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...dates.map((date) => ({
      url: `${base}/brief/${date}`,
      lastModified: new Date(date + "T12:00:00Z"),
      changeFrequency: "never" as const,
      priority: 0.7,
    })),
  ];
}

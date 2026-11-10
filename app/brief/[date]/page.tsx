import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoisebriefContent } from "@/app/components/NoisebriefContent";
import { getAvailableDates, getBriefByDate } from "@/lib/brief-server";
import { isValidDateString } from "@/lib/date";
import { jsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site";

// Rendered on first request, then cached; the daily cron revalidates these pages.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ date: string }> };

function formatBriefDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function truncateToFirstSentence(text: string, maxLen: number): string {
  const trimmed = text.trim();
  const dot = trimmed.indexOf(".");
  const first = dot >= 0 ? trimmed.slice(0, dot + 1) : trimmed;
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen - 3).trimEnd() + "...";
}

async function loadBrief(date: string) {
  if (!isValidDateString(date)) return null;
  return getBriefByDate(date);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { date } = await params;
  const brief = await loadBrief(date);
  if (!brief) return { title: "Brief not found | Noisebrief", robots: { index: false } };

  const path = `/brief/${date}`;
  const title = `${brief.title?.trim() || "Tech brief"} · ${formatBriefDate(date)} | Noisebrief`;
  const description = truncateToFirstSentence(brief.summary, 160);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${getSiteUrl()}${path}`, siteName: "Noisebrief", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Historical brief at /brief/YYYY-MM-DD. */
export default async function BriefDatePage({ params }: Params) {
  const { date } = await params;
  const [brief, dates] = await Promise.all([loadBrief(date), getAvailableDates()]);
  if (!brief) notFound();

  const siteUrl = getSiteUrl();
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: brief.title?.trim() || "Tech brief",
    datePublished: date,
    description: truncateToFirstSentence(brief.summary, 160),
    url: `${siteUrl}/brief/${date}`,
    image: `${siteUrl}/brief/${date}/opengraph-image`,
    author: { "@type": "Organization", name: "Noisebrief", url: siteUrl },
    publisher: { "@type": "Organization", name: "Noisebrief", url: siteUrl },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <NoisebriefContent key={date} brief={brief} dates={dates} />
    </>
  );
}

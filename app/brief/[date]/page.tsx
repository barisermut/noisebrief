import type { Metadata } from "next";
import Link from "next/link";
import { NoisebriefContent } from "@/app/components/NoisebriefContent";
import { getBriefByDate } from "@/lib/brief-server";
import { getSiteUrl } from "@/lib/site";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateParam(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function formatBriefDate(dateStr: string): string {
  return new Date(dateStr + "Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function truncateToFirstSentence(text: string, maxLen: number): string {
  const trimmed = text.trim();
  const dot = trimmed.indexOf(".");
  const first = dot >= 0 ? trimmed.slice(0, dot + 1) : trimmed;
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen - 3).trimEnd() + "...";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!date || !isValidDateParam(date)) {
    return {
      title: "Brief not found — Noisebrief",
      description: "Daily AI-generated tech news digest.",
    };
  }

  const brief = await getBriefByDate(date);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/brief/${date}`;
  const formattedDate = formatBriefDate(date);

  if (!brief) {
    return {
      title: `Brief — Noisebrief | ${formattedDate}`,
      description: "Daily AI-generated tech news digest.",
      openGraph: { url, title: `Brief — Noisebrief | ${formattedDate}`, description: "Daily AI-generated tech news digest." },
      twitter: { card: "summary_large_image", title: `Brief — Noisebrief | ${formattedDate}`, description: "Daily AI-generated tech news digest." },
    };
  }

  const title = brief.title?.trim() || "Tech brief";
  const metaTitle = `${title} — Noisebrief | ${formattedDate}`;
  const description = truncateToFirstSentence(brief.summary, 160);

  return {
    title: metaTitle,
    description,
    openGraph: {
      title: metaTitle,
      description,
      url,
      siteName: "Noisebrief",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
    },
  };
}

/**
 * Historical brief at /brief/YYYY-MM-DD. Validates date; invalid shows inline error.
 */
export default async function BriefDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  if (!date || !isValidDateParam(date)) {
    return (
      <div className="mx-auto min-w-0 max-w-2xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Invalid date.</p>
        <Link
          href="/"
          className="mt-2 inline-block text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          Back to today
        </Link>
      </div>
    );
  }

  const brief = await getBriefByDate(date);
  const siteUrl = getSiteUrl();

  const articleSchema =
    brief ?
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: brief.title?.trim() || "Tech brief",
        datePublished: brief.date,
        description: truncateToFirstSentence(brief.summary, 160),
        url: `${siteUrl}/brief/${date}`,
        publisher: { "@type": "Organization", name: "Noisebrief", url: siteUrl },
      }
    : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <NoisebriefContent />
    </>
  );
}

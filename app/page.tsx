import type { Metadata } from "next";
import { getAvailableDates, getLatestBrief } from "@/lib/brief-server";
import { jsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site";
import { NoisebriefContent } from "./components/NoisebriefContent";

// The daily cron revalidates this page right after a new brief is stored.
export const revalidate = 3600;

const siteUrl = getSiteUrl();
const description =
  "Daily AI-generated tech news digest. Get today's most important tech stories summarized in plain English.";

export const metadata: Metadata = {
  title: "Noisebrief | Today's Tech News, Briefly",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Noisebrief | Today's Tech News, Briefly",
    description,
    url: siteUrl,
    siteName: "Noisebrief",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noisebrief | Today's Tech News, Briefly",
    description: "Daily AI-generated tech news digest.",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Noisebrief",
  url: siteUrl,
  description: "Daily AI-generated tech news digest",
};

export default async function Home() {
  const [brief, dates] = await Promise.all([getLatestBrief(), getAvailableDates()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webSiteSchema) }} />
      <NoisebriefContent key={brief?.date ?? "none"} brief={brief} dates={dates} />
    </>
  );
}

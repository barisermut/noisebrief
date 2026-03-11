import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import { NoisebriefContent } from "./components/NoisebriefContent";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Noisebrief — Today's Tech News, Briefly",
  description:
    "Daily AI-generated tech news digest. Get today's most important tech stories summarized in plain English.",
  openGraph: {
    title: "Noisebrief — Today's Tech News, Briefly",
    description:
      "Daily AI-generated tech news digest. Get today's most important tech stories summarized in plain English.",
    url: siteUrl,
    siteName: "Noisebrief",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noisebrief — Today's Tech News, Briefly",
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <NoisebriefContent />
    </>
  );
}

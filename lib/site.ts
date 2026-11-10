/** Base URL for the site; used for metadata, sitemap, OG and links in emails. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.noisebrief.com";
}

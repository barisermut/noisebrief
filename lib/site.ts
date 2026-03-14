/** Base URL for the site; used for metadata, sitemap, OG. Phase 10 will swap to custom domain via this var. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.noisebrief.com";
}

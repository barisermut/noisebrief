import { NextRequest, NextResponse } from "next/server";

const FAVICON_BASE = "https://www.google.com/s2/favicons";
const DOMAIN_MAX_LENGTH = 253; // max hostname length per RFC
const FETCH_TIMEOUT_MS = 8000;

const DOMAIN_MAP: Record<string, string> = {
  "hnrss.org": "news.ycombinator.com",
  "feeds.feedburner.com": "techcrunch.com",
  "reddit.com": "reddit.com",
};

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  let cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0] ?? domain;
  cleanDomain = DOMAIN_MAP[cleanDomain] ?? cleanDomain;
  if (cleanDomain.length > DOMAIN_MAX_LENGTH) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${FAVICON_BASE}?domain=${encodeURIComponent(cleanDomain)}&sz=32`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Noisebrief/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/x-icon",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}

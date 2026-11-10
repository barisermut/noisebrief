"use client";

import { useState } from "react";

/** Icons for the feeds the daily cron reads, shipped as static files in /public/source-icons. */
const ICON_BY_DOMAIN: Record<string, string> = {
  "hnrss.org": "news.ycombinator.com",
  "news.ycombinator.com": "news.ycombinator.com",
  "techcrunch.com": "techcrunch.com",
  "feeds.feedburner.com": "techcrunch.com",
  "theverge.com": "theverge.com",
  "wired.com": "wired.com",
  "reddit.com": "reddit.com",
};

const FALLBACK_COLORS: Record<string, string> = {
  "Hacker News": "#c2410c",
  TechCrunch: "#047857",
  "The Verge": "#7e22ce",
  Wired: "#3f3f46",
};

interface SourceFaviconProps {
  domain: string;
  sourceName: string;
  size?: number;
  className?: string;
}

export function SourceFavicon({ domain, sourceName, size = 20, className = "" }: SourceFaviconProps) {
  const [failed, setFailed] = useState(false);
  const icon = ICON_BY_DOMAIN[domain.replace(/^www\./, "")];

  if (!icon || failed) {
    const bg = FALLBACK_COLORS[sourceName] ?? (sourceName.startsWith("r/") ? "#c2410c" : "#0f766e");
    return (
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded font-semibold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: bg, fontSize: Math.max(8, size * 0.55) }}
      >
        {sourceName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // Plain <img>: tiny static file, no optimizer round-trip needed.
    <img
      src={`/source-icons/${icon}.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

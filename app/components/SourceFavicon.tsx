"use client";

import { useState } from "react";
import Image from "next/image";

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "rgb(255, 102, 0)", // orange
  TechCrunch: "rgb(0, 170, 90)", // green
  "The Verge": "rgb(170, 0, 255)", // purple
  Wired: "rgb(100, 100, 100)", // gray
};
const REDDIT_SOURCES = [
  "r/technology",
  "r/artificial",
  "r/singularity",
  "r/tech",
  "r/MachineLearning",
  "r/ProductManagement",
];
const DEFAULT_COLOR = "rgb(0, 212, 170)"; // teal

function getFallbackColor(sourceName: string): string {
  if (SOURCE_COLORS[sourceName]) return SOURCE_COLORS[sourceName];
  if (REDDIT_SOURCES.some((r) => sourceName === r)) return "rgb(255, 69, 0)"; // red
  return DEFAULT_COLOR;
}

interface SourceFaviconProps {
  domain: string;
  sourceName: string;
  size?: number;
  className?: string;
}

export function SourceFavicon({
  domain,
  sourceName,
  size = 20,
  className = "",
}: SourceFaviconProps) {
  const [failed, setFailed] = useState(false);
  const letter = sourceName.charAt(0).toUpperCase();
  const bgColor = getFallbackColor(sourceName);

  if (failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded font-semibold text-white ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          fontSize: Math.max(8, size * 0.55),
        }}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    <Image
      src={`/api/favicon?domain=${encodeURIComponent(domain)}`}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded ${className}`}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

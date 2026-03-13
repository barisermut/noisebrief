"use client";

import { memo } from "react";
import type { BriefParagraph } from "@/types/brief";

interface ParagraphWithKeywordProps {
  paragraph: BriefParagraph;
}

function ParagraphWithKeywordComponent({ paragraph }: ParagraphWithKeywordProps) {
  const { text, keywords } = paragraph;

  if (!keywords || keywords.length === 0) return <>{text}</>;

  const positioned = keywords
    .map((k) => ({
      ...k,
      idx: text.toLowerCase().indexOf(k.keyword.toLowerCase()),
    }))
    .filter((k) => k.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  if (positioned.length === 0) return <>{text}</>;

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < positioned.length; i++) {
    const k = positioned[i];
    if (k.idx > cursor) {
      segments.push(text.slice(cursor, k.idx));
    }
    segments.push(
      <a
        key={`${k.idx}-${i}`}
        href={k.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-600 dark:text-teal-400 underline underline-offset-2 decoration-teal-600/40 dark:decoration-teal-400/40 hover:decoration-teal-600 dark:hover:decoration-teal-400 transition-colors"
      >
        {text.slice(k.idx, k.idx + k.keyword.length)}
      </a>
    );
    cursor = k.idx + k.keyword.length;
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}

export const ParagraphWithKeyword = memo(ParagraphWithKeywordComponent);

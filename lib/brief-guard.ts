import type { BriefParagraph } from "@/types";

const RAW_JSON_MARKERS = /```|"(?:title|paragraphs|keywords)"\s*:/i;

/**
 * Final safety gate before a brief is stored or emailed.
 * A missing brief is preferable to publishing raw model output.
 */
export function isPublishableBrief(
  title: string | null | undefined,
  paragraphs: BriefParagraph[]
): boolean {
  if (!title?.trim() || paragraphs.length !== 3) return false;

  return paragraphs.every((paragraph) => {
    const text = paragraph.text.trim();
    if (!text) return false;
    if (text.startsWith("{") || text.startsWith("[")) return false;
    return !RAW_JSON_MARKERS.test(text);
  });
}

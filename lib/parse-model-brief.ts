import { parseJsonWithRepair } from "@/lib/llm-json";
import type { BriefParagraph } from "@/types";

/**
 * Normalizes Sonnet's `paragraphs` field: array, JSON string of array/object,
 * or falls back to splitting raw model text on blank lines (legacy error path).
 */
export function parseParagraphsFromPayload(
  raw: unknown,
  fallbackRawText: string
): BriefParagraph[] {
  if (typeof raw === "string") {
    const inner = raw.trim();
    if (inner.startsWith("[") || inner.startsWith("{")) {
      try {
        const parsed = parseJsonWithRepair(inner) as unknown;
        if (Array.isArray(parsed)) {
          return parseParagraphsFromPayload(parsed, fallbackRawText);
        }
        if (
          parsed &&
          typeof parsed === "object" &&
          "paragraphs" in parsed &&
          Array.isArray((parsed as { paragraphs: unknown }).paragraphs)
        ) {
          return parseParagraphsFromPayload(
            (parsed as { paragraphs: unknown }).paragraphs,
            fallbackRawText
          );
        }
      } catch {
        /* fall through to array / fallback paths */
      }
    }
  }

  if (Array.isArray(raw)) {
    return raw.map((p: unknown) => {
      if (typeof p === "string") {
        return { text: p, keywords: [] };
      }
      const obj = p as Record<string, unknown>;
      const text = typeof obj.text === "string" ? obj.text : "";
      if ("keywords" in obj && Array.isArray(obj.keywords)) {
        const keywords = (obj.keywords as Array<Record<string, unknown>>)
          .filter(
            (k) =>
              typeof k.keyword === "string" && typeof k.url === "string"
          )
          .map((k) => ({ keyword: k.keyword as string, url: k.url as string }));
        return { text, keywords };
      }
      if (
        typeof obj.keyword === "string" &&
        obj.keyword &&
        typeof obj.url === "string" &&
        obj.url
      ) {
        return {
          text,
          keywords: [{ keyword: obj.keyword, url: obj.url }],
        };
      }
      return { text, keywords: [] };
    });
  }
  return fallbackRawText
    .split(/\n\n+/)
    .filter(Boolean)
    .map((text) => ({ text: text.trim(), keywords: [] }));
}

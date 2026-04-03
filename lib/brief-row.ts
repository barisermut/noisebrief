import { jsonrepair } from "jsonrepair";
import type { ParagraphsField } from "@/types/brief";
import { normalizeParagraphs } from "@/types/brief";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Model output often includes unescaped quotes inside strings (e.g. "Incognito Mode"), which breaks JSON.parse. */
function parseJsonLenient(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(jsonrepair(text));
    } catch {
      return null;
    }
  }
}

function parseBriefShape(text: string): Record<string, unknown> | null {
  const t = text.trim();
  if (!t.startsWith("{")) return null;
  const parsed = parseJsonLenient(t);
  if (!isRecord(parsed) || !Array.isArray(parsed.paragraphs)) return null;
  return parsed;
}

/**
 * If the daily cron stored the full model JSON in `summary` (or `paragraphs` is missing),
 * recover title, plain-text summary, and paragraph payloads for the UI and emails.
 */
function tryExtractBriefFromSummaryJson(summary: string): {
  title: string | null;
  summaryPlain: string;
  paragraphs: ParagraphsField;
} | null {
  const parsed = parseBriefShape(summary);
  if (!parsed) return null;
  const title = typeof parsed.title === "string" ? parsed.title : null;
  const paragraphs = parsed.paragraphs as ParagraphsField;
  const summaryPlain = normalizeParagraphs(paragraphs)
    .map((p) => p.text)
    .join("\n\n");
  return { title, summaryPlain, paragraphs };
}

/**
 * Unwrap `paragraphs` from Supabase / legacy shapes (stringified JSON, mistaken nesting).
 * Recover from a full JSON brief accidentally stored in `summary`.
 */
export function normalizeBriefRowFields(row: {
  title: string | null;
  summary: string;
  paragraphs: unknown;
}): {
  title: string | null;
  summary: string;
  paragraphs: ParagraphsField;
} {
  let title = row.title;
  let summary = row.summary ?? "";
  let paragraphs: unknown = row.paragraphs;

  if (typeof paragraphs === "string") {
    const pt = paragraphs.trim();
    if (pt.startsWith("[") || pt.startsWith("{")) {
      const parsed = parseJsonLenient(pt);
      if (parsed !== null) paragraphs = parsed;
    }
  }

  if (isRecord(paragraphs) && Array.isArray(paragraphs.paragraphs)) {
    paragraphs = paragraphs.paragraphs;
  }

  const genericTitle = (t: string | null) =>
    !t?.trim() || t.trim() === "Today's Brief";

  const fromSummary = tryExtractBriefFromSummaryJson(summary);
  if (fromSummary) {
    summary = fromSummary.summaryPlain;
    if (fromSummary.title && genericTitle(title)) title = fromSummary.title;
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      paragraphs = fromSummary.paragraphs;
    }
  }

  let parasField: ParagraphsField = Array.isArray(paragraphs)
    ? paragraphs
    : [];

  const unwrapped = unwrapParagraphFieldIfEmbeddedBriefJson(parasField);
  parasField = unwrapped.field;
  if (unwrapped.titleFromBlob && genericTitle(title)) {
    title = unwrapped.titleFromBlob;
  }

  return { title, summary, paragraphs: parasField };
}

/** Model/cron bug: a single "paragraph" whose text is the entire `{ title, paragraphs }` JSON. */
function unwrapParagraphFieldIfEmbeddedBriefJson(
  field: ParagraphsField
): { field: ParagraphsField; titleFromBlob: string | null } {
  if (!Array.isArray(field) || field.length !== 1) {
    return { field, titleFromBlob: null };
  }
  const only = field[0];
  const text =
    typeof only === "string" ? only : ((only as { text?: string }).text ?? "");
  if (typeof text !== "string" || !text.trim().startsWith("{")) {
    return { field, titleFromBlob: null };
  }
  const parsed = parseBriefShape(text);
  if (!parsed) {
    return { field, titleFromBlob: null };
  }
  const titleFromBlob =
    typeof parsed.title === "string" ? parsed.title : null;
  return {
    field: parsed.paragraphs as ParagraphsField,
    titleFromBlob,
  };
}

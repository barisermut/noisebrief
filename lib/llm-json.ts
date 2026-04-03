import { jsonrepair } from "jsonrepair";

/**
 * Strip markdown fences and isolate `{ ... }` when the model adds prose around JSON.
 * Used for daily brief Sonnet output and small Haiku JSON blobs.
 */
export function extractJsonObjectFromText(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/**
 * Parse JSON; on failure run jsonrepair then parse again. Throws if still invalid.
 * Cron / model pipeline: outer try/catch may fall back to plain-text split.
 */
export function parseJsonWithRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(jsonrepair(text));
  }
}

/**
 * Same as {@link parseJsonWithRepair} but returns null when the payload cannot be repaired,
 * or when the top-level value is not an object or array (jsonrepair may quote arbitrary prose).
 * Use for Supabase row normalization where we must not throw.
 */
export function tryParseJsonWithRepair(text: string): unknown | null {
  try {
    const v = parseJsonWithRepair(text);
    if (v === null || typeof v !== "object") return null;
    return v;
  } catch {
    return null;
  }
}

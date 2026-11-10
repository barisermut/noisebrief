import { jsonrepair } from "jsonrepair";

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

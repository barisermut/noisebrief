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
 * Escape unescaped quotes inside JSON string values.
 *
 * Models occasionally emit prose such as `"text":"called it "misaligned" — ..."`
 * where the inner quotes are not escaped. A quote only closes a JSON string when
 * the next non-whitespace character is a structural token; other quotes are
 * preserved as escaped prose.
 */
export function escapeStrayQuotesInStrings(text: string): string {
  let output = "";
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (!inString) {
      output += char;
      if (char === '"') inString = true;
      continue;
    }

    if (char === "\\") {
      output += char;
      if (i + 1 < text.length) output += text[++i];
      continue;
    }

    if (char !== '"') {
      output += char;
      continue;
    }

    let nextIndex = i + 1;
    while (nextIndex < text.length && /\s/.test(text[nextIndex])) {
      nextIndex++;
    }
    const next = text[nextIndex];
    const closesString =
      next === "," ||
      next === ":" ||
      next === "}" ||
      next === "]" ||
      next === undefined;

    if (closesString) {
      output += char;
      inString = false;
    } else {
      output += '\\"';
    }
  }

  return output;
}

/**
 * Parse JSON through progressively more defensive repair strategies.
 * Throws if every strategy fails.
 */
export function parseJsonWithRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (strictError) {
    try {
      return JSON.parse(jsonrepair(text));
    } catch {
      const escaped = escapeStrayQuotesInStrings(text);
      try {
        return JSON.parse(escaped);
      } catch {
        try {
          return JSON.parse(jsonrepair(escaped));
        } catch {
          throw strictError;
        }
      }
    }
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

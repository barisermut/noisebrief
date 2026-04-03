import { describe, expect, it } from "vitest";
import {
  extractJsonObjectFromText,
  parseJsonWithRepair,
  tryParseJsonWithRepair,
} from "@/lib/llm-json";

/** Invalid JSON: quotes inside a string value are not escaped (common Sonnet mistake). */
const MALFORMED_INNER_QUOTES = `{"title":"T","paragraphs":[{"text":"say "Quoted" here","keywords":[]}]}`;

describe("extractJsonObjectFromText", () => {
  it("pulls JSON from a fenced block", () => {
    const raw = `Here you go:\n\`\`\`json\n{"a":1}\n\`\`\`\nThanks`;
    expect(extractJsonObjectFromText(raw)).toBe('{"a":1}');
  });

  it("trims prose outside first { ... last }", () => {
    const raw = `Sure — {"x":true} done`;
    expect(extractJsonObjectFromText(raw)).toBe('{"x":true}');
  });

  it("returns trimmed input when no braces", () => {
    expect(extractJsonObjectFromText("  hello  ")).toBe("hello");
  });
});

describe("parseJsonWithRepair", () => {
  it("parses valid JSON without repair", () => {
    expect(parseJsonWithRepair('{"ok":true}')).toEqual({ ok: true });
  });

  it("repairs malformed JSON with unescaped inner quotes", () => {
    const fixed = parseJsonWithRepair(MALFORMED_INNER_QUOTES) as {
      title: string;
      paragraphs: Array<{ text: string }>;
    };
    expect(fixed.title).toBe("T");
    expect(fixed.paragraphs[0].text).toContain("Quoted");
  });

  it("throws when repair is impossible", () => {
    expect(() => parseJsonWithRepair("")).toThrow();
  });
});

describe("tryParseJsonWithRepair", () => {
  it("returns null for prose jsonrepair would only wrap as a JSON string", () => {
    expect(tryParseJsonWithRepair("not json at all")).toBeNull();
  });

  it("returns null when repair throws (e.g. empty input)", () => {
    expect(tryParseJsonWithRepair("")).toBeNull();
    expect(tryParseJsonWithRepair("{{{")).toBeNull();
  });

  it("returns parsed object for repairable malformed JSON", () => {
    const v = tryParseJsonWithRepair(MALFORMED_INNER_QUOTES);
    expect(v).not.toBeNull();
    expect((v as { title: string }).title).toBe("T");
  });
});

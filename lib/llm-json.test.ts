import { describe, expect, it } from "vitest";
import {
  parseJsonWithRepair,
  tryParseJsonWithRepair,
} from "@/lib/llm-json";

/** Invalid JSON: quotes inside a string value are not escaped (common Sonnet mistake). */
const MALFORMED_INNER_QUOTES = `{"title":"T","paragraphs":[{"text":"say "Quoted" here","keywords":[]}]}`;

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

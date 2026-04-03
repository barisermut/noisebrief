import { describe, expect, it } from "vitest";
import { parseParagraphsFromPayload } from "@/lib/parse-model-brief";

describe("parseParagraphsFromPayload", () => {
  it("maps a well-formed array of paragraph objects", () => {
    const out = parseParagraphsFromPayload(
      [
        {
          text: "Hello world.",
          keywords: [{ keyword: "world", url: "https://a.com" }],
        },
      ],
      ""
    );
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("Hello world.");
    expect(out[0].keywords).toEqual([{ keyword: "world", url: "https://a.com" }]);
  });

  it("parses paragraphs from a JSON string (double-encoded)", () => {
    const raw = JSON.stringify([
      { text: "A", keywords: [] },
      { text: "B", keywords: [] },
    ]);
    const out = parseParagraphsFromPayload(raw, "");
    expect(out).toHaveLength(2);
    expect(out.map((p) => p.text)).toEqual(["A", "B"]);
  });

  it("unwraps string containing nested { paragraphs: [...] }", () => {
    const blob = JSON.stringify({
      title: "T",
      paragraphs: [{ text: "Inner", keywords: [] }],
    });
    const out = parseParagraphsFromPayload(blob, "");
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("Inner");
  });

  it("repairs malformed JSON string with unescaped inner quotes", () => {
    const malformed = `{"paragraphs":[{"text":"say "Hi" there","keywords":[]}]}`;
    const out = parseParagraphsFromPayload(malformed, "");
    expect(out).toHaveLength(1);
    expect(out[0].text).toContain("Hi");
  });

  it("supports legacy single keyword + url per paragraph", () => {
    const out = parseParagraphsFromPayload(
      [
        {
          text: "Acme Corp announced earnings.",
          keyword: "Acme Corp",
          url: "https://news.example/x",
        },
      ],
      ""
    );
    expect(out[0].keywords).toEqual([
      { keyword: "Acme Corp", url: "https://news.example/x" },
    ]);
  });

  it("falls back to splitting fallback text on blank lines when raw is null", () => {
    const out = parseParagraphsFromPayload(
      null,
      "First block.\n\nSecond block.\n\nThird."
    );
    expect(out).toHaveLength(3);
    expect(out[0].text).toBe("First block.");
    expect(out[2].text).toBe("Third.");
  });

  it("stringifies string elements in an array as paragraphs without keywords", () => {
    const out = parseParagraphsFromPayload(["Line one", "Line two"], "");
    expect(out).toEqual([
      { text: "Line one", keywords: [] },
      { text: "Line two", keywords: [] },
    ]);
  });
});

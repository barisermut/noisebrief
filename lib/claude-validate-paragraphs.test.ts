import { describe, expect, it } from "vitest";
import { validateParagraphs } from "@/lib/claude";

const URL_A = "https://allowed-a.example/path";
const URL_B = "https://allowed-b.example/path";
const validUrls = [URL_A, URL_B];

describe("validateParagraphs", () => {
  it("drops keywords whose URL is not in the allowlist", () => {
    const out = validateParagraphs(
      [
        {
          text: "Alpha and Beta here.",
          keywords: [
            { keyword: "Alpha", url: URL_A },
            { keyword: "Beta", url: "https://evil.example" },
          ],
        },
      ],
      validUrls
    );
    expect(out[0].keywords).toEqual([{ keyword: "Alpha", url: URL_A }]);
  });

  it("drops keywords that do not appear in paragraph text (case-insensitive)", () => {
    const out = validateParagraphs(
      [
        {
          text: "Only Seattle is in this sentence.",
          keywords: [{ keyword: "Portland", url: URL_A }],
        },
      ],
      validUrls
    );
    expect(out[0].keywords).toHaveLength(0);
  });

  it("when multiple keywords survive, enforces minimum word distance between them", () => {
    const text =
      "Word1 " +
      "x ".repeat(20) +
      "Word2 " +
      "y ".repeat(20) +
      "Word3";
    const out = validateParagraphs(
      [
        {
          text,
          keywords: [
            { keyword: "Word1", url: URL_A },
            { keyword: "Word2", url: URL_B },
            { keyword: "Word3", url: URL_A },
          ],
        },
      ],
      validUrls
    );
    const kws = out[0].keywords.map((k) => k.keyword);
    expect(kws).toContain("Word1");
    expect(kws).toContain("Word2");
    expect(kws).toContain("Word3");
  });

  it("when keywords are too close, keeps only those spaced apart", () => {
    const out = validateParagraphs(
      [
        {
          text: "Acme and Beta are close together in this short line.",
          keywords: [
            { keyword: "Acme", url: URL_A },
            { keyword: "Beta", url: URL_B },
          ],
        },
      ],
      validUrls
    );
    expect(out[0].keywords.length).toBeLessThanOrEqual(1);
  });

  it("passes through empty keyword arrays", () => {
    const paragraphs = [{ text: "Plain.", keywords: [] }];
    expect(validateParagraphs(paragraphs, validUrls)).toEqual(paragraphs);
  });
});

import { describe, expect, it } from "vitest";
import type { ParagraphsField } from "@/types/brief";
import { normalizeParagraphs } from "@/types/brief";

describe("normalizeParagraphs", () => {
  it("maps string[] to BriefParagraph with empty keywords", () => {
    expect(normalizeParagraphs(["a", "b"])).toEqual([
      { text: "a", keywords: [] },
      { text: "b", keywords: [] },
    ]);
  });

  it("keeps valid keywords[] entries and drops bad shapes", () => {
    const out = normalizeParagraphs([
      {
        text: "Foo bar baz.",
        keywords: [
          { keyword: "bar", url: "https://x.com" },
          { keyword: "nope", url: null as unknown as string },
        ],
      },
    ]);
    expect(out[0].keywords).toEqual([{ keyword: "bar", url: "https://x.com" }]);
  });

  it("maps legacy keyword + url shape", () => {
    expect(
      normalizeParagraphs([
        {
          text: "Visit Acme today.",
          keyword: "Acme",
          url: "https://acme.test",
        },
      ])
    ).toEqual([
      {
        text: "Visit Acme today.",
        keywords: [{ keyword: "Acme", url: "https://acme.test" }],
      },
    ]);
  });

  it("drops invalid keyword objects", () => {
    const out = normalizeParagraphs([
      {
        text: "Hello",
        keywords: [
          { keyword: "x", url: "https://a.com" },
          { keyword: 1 as unknown as string, url: "https://b.com" },
        ],
      },
    ]);
    expect(out[0].keywords).toHaveLength(1);
  });

  it("uses empty text when text field missing", () => {
    expect(
      normalizeParagraphs([{}] as unknown as ParagraphsField)
    ).toEqual([{ text: "", keywords: [] }]);
  });
});

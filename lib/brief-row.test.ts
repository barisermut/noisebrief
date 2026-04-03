import { describe, expect, it } from "vitest";
import { normalizeBriefRowFields } from "@/lib/brief-row";
import type { ParagraphsField } from "@/types/brief";

/**
 * Regression: Sonnet returned JSON with unescaped double quotes inside a string
 * (e.g. ... its "Incognito Mode" is a sham ...), so JSON.parse threw, cron wrote
 * summary = full blob + title = "Today's Brief". jsonrepair + normalizeBriefRowFields
 * must recover structured paragraphs and the real title on read.
 */
const MALFORMED_BRIEF_JSON = `{
  "title": "AI Breakthroughs and Big Bets",
  "paragraphs": [
    {
      "text": "AI systems are achieving breakthrough scientific accomplishments. AI has solved John Conway's decades-old bountied mathematics problem.",
      "keywords": [
        { "keyword": "John Conway's decades-old bountied mathematics problem", "url": "https://www.reddit.com/r/singularity/comments/1sb4p9x/example/" }
      ]
    },
    {
      "text": "Major tech companies are making massive strategic investments. Microsoft announced a $10 billion commitment to Japan.",
      "keywords": [
        { "keyword": "Microsoft", "url": "https://www.reddit.com/r/artificial/comments/1sb65un/example/" }
      ]
    },
    {
      "text": "Platform controversies are exposing cracks in how tech companies handle user privacy and data. Perplexity faces a lawsuit claiming its "Incognito Mode" is a sham that fails to protect user privacy as advertised.",
      "keywords": [
        { "keyword": "Perplexity", "url": "https://www.reddit.com/r/artificial/comments/1sb38mv/example/" }
      ]
    }
  ]
}`;

describe("normalizeBriefRowFields", () => {
  it("rejects raw JSON.parse on the production-style malformed LLM blob (documents why jsonrepair exists)", () => {
    expect(() => JSON.parse(MALFORMED_BRIEF_JSON)).toThrow();
  });

  it("recovers title, plain summary, and three paragraphs when summary holds malformed JSON with inner quotes", () => {
    const out = normalizeBriefRowFields({
      title: "Today's Brief",
      summary: MALFORMED_BRIEF_JSON,
      paragraphs: [],
    });

    expect(out.title).toBe("AI Breakthroughs and Big Bets");
    expect(out.summary).toContain("Perplexity faces a lawsuit");
    expect(out.summary).toContain("John Conway");
    expect(out.summary).not.toMatch(/^\s*\{/);
    expect(out.paragraphs).toHaveLength(3);
    const texts = out.paragraphs.map((p) =>
      typeof p === "string" ? p : (p as { text: string }).text
    );
    expect(texts[2]).toContain("Incognito Mode");
    expect(texts[2]).toContain("Perplexity");
  });

  it("unwraps a single paragraph whose text is the full malformed brief JSON blob", () => {
    const out = normalizeBriefRowFields({
      title: "Today's Brief",
      summary: "",
      paragraphs: [
        {
          text: MALFORMED_BRIEF_JSON,
          keywords: [],
        },
      ] as ParagraphsField,
    });

    expect(out.title).toBe("AI Breakthroughs and Big Bets");
    expect(out.paragraphs).toHaveLength(3);
    expect(out.summary).toContain("Microsoft");
  });

  it("parses paragraphs column when stored as a JSON string (double-encoded)", () => {
    const inner: ParagraphsField = [
      { text: "Only paragraph.", keywords: [{ keyword: "Only", url: "https://example.com/a" }] },
    ];
    const out = normalizeBriefRowFields({
      title: "Custom Title",
      summary: "Short daily text.",
      paragraphs: JSON.stringify(inner),
    });

    expect(out.paragraphs).toHaveLength(1);
    const p = out.paragraphs[0] as { text: string; keywords: unknown[] };
    expect(p.text).toBe("Only paragraph.");
    expect(p.keywords).toHaveLength(1);
  });

  it("unwraps mistaken { paragraphs: [...] } object in paragraphs column", () => {
    const out = normalizeBriefRowFields({
      title: "Today's Brief",
      summary: "ignored when paragraphs populated",
      paragraphs: {
        paragraphs: [
          { text: "Nested shape.", keywords: [] },
        ],
      },
    });

    expect(out.paragraphs).toHaveLength(1);
    expect((out.paragraphs[0] as { text: string }).text).toBe("Nested shape.");
  });

  it("does not overwrite a non-generic title when recovering from summary JSON", () => {
    const out = normalizeBriefRowFields({
      title: "Editor Override",
      summary: MALFORMED_BRIEF_JSON,
      paragraphs: [],
    });

    expect(out.title).toBe("Editor Override");
  });

  it("leaves a normal row unchanged (valid paragraphs + prose summary)", () => {
    const paragraphs: ParagraphsField = [
      { text: "First.", keywords: [] },
      { text: "Second.", keywords: [] },
    ];
    const out = normalizeBriefRowFields({
      title: "Stable Title",
      summary: "First.\n\nSecond.",
      paragraphs,
    });

    expect(out).toEqual({
      title: "Stable Title",
      summary: "First.\n\nSecond.",
      paragraphs,
    });
  });
});

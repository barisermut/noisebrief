import { describe, expect, it } from "vitest";
import { isPublishableBrief } from "@/lib/brief-guard";
import type { BriefParagraph } from "@/types";

const validParagraphs: BriefParagraph[] = [
  { text: "First complete editorial paragraph.", keywords: [] },
  { text: "Second complete editorial paragraph.", keywords: [] },
  { text: "Third complete editorial paragraph.", keywords: [] },
];

describe("isPublishableBrief", () => {
  it("accepts a structured three-paragraph brief", () => {
    expect(isPublishableBrief("A Valid Daily Title", validParagraphs)).toBe(
      true
    );
  });

  it("rejects the wrong paragraph count or empty content", () => {
    expect(isPublishableBrief("Title", validParagraphs.slice(0, 2))).toBe(
      false
    );
    expect(
      isPublishableBrief("Title", [
        ...validParagraphs.slice(0, 2),
        { text: " ", keywords: [] },
      ])
    ).toBe(false);
  });

  it.each([
    '```json\n{"title":"Raw"}\n```',
    '{"paragraphs":[]}',
    'Model output included a "keywords": array by mistake.',
  ])("rejects raw model JSON marker: %s", (text) => {
    expect(
      isPublishableBrief("Title", [
        { text, keywords: [] },
        validParagraphs[1],
        validParagraphs[2],
      ])
    ).toBe(false);
  });
});

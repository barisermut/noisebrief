export interface ParagraphKeyword {
  keyword: string;
  url: string;
}

export interface BriefParagraph {
  text: string;
  keywords: ParagraphKeyword[];
}

/** Raw payload from API: string[] | legacy single-keyword objects | new keywords[] objects */
export type ParagraphsField =
  | string[]
  | Array<{ text: string; keyword?: string | null; url?: string | null }>
  | Array<{ text: string; keywords?: ParagraphKeyword[] }>;

export function normalizeParagraphs(raw: ParagraphsField): BriefParagraph[] {
  return raw.map((p) => {
    if (typeof p === "string") return { text: p, keywords: [] };
    const obj = p as Record<string, unknown>;
    const text = typeof obj.text === "string" ? obj.text : "";
    if ("keywords" in obj && Array.isArray(obj.keywords)) {
      const keywords = (obj.keywords as ParagraphKeyword[]).filter(
        (k) =>
          typeof k === "object" &&
          k !== null &&
          typeof k.keyword === "string" &&
          typeof k.url === "string"
      );
      return { text, keywords };
    }
    if ("keyword" in obj && obj.keyword && "url" in obj && obj.url) {
      return {
        text,
        keywords: [
          { keyword: obj.keyword as string, url: obj.url as string },
        ],
      };
    }
    return { text, keywords: [] };
  });
}

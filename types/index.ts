export interface Source {
  title: string;
  url: string;
  sourceName: string;
  domain: string;
  publishedAt: string;
}

export type { BriefParagraph, ParagraphKeyword, ParagraphsField } from "./brief";
export { normalizeParagraphs } from "./brief";

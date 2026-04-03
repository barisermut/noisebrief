export type Tone =
  | "Quirky"
  | "Formal"
  | "Cheesy"
  | "Savage"
  | "Inspirational"
  | "TLDR";

export interface Source {
  title: string;
  url: string;
  sourceName: string;
  domain: string;
  publishedAt: string;
}

import type { BriefParagraph, ParagraphKeyword, ParagraphsField } from "./brief";
export type { BriefParagraph, ParagraphKeyword, ParagraphsField };
export { normalizeParagraphs } from "./brief";

export interface DailyBrief {
  id: string;
  date: string;
  title: string;
  summary: string;
  paragraphs: ParagraphsField;
  sources: Source[];
  createdAt: string;
}

/* MAKE IT YOURS — disabled
export interface GeneratedPost {
  tone: Tone;
  post: string;
}
*/

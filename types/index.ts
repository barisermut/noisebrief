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

export interface DailyBrief {
  id: string;
  date: string;
  title: string;
  summary: string;
  paragraphs: string[];
  sources: Source[];
  createdAt: string;
}

export interface GeneratedPost {
  tone: Tone;
  post: string;
}

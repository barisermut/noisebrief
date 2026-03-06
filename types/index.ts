export type Domain =
  | "AI"
  | "SaaS"
  | "Product"
  | "Fintech"
  | "DevTools"
  | "Design"
  | "Growth";

export type Source = "ProductHunt" | "HackerNews" | "Reddit";

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: Source;
  sourceDomain: string;
  summary: string;
  tags: Domain[];
  relevanceScore: number;
  publishedAt: string;
  upvotes?: number;
}

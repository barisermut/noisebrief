import { fetchRssFeed } from "./fetchRss";
import type { Source } from "@/types";

const RSS_SOURCES: { url: string; name: string; domain: string }[] = [
  { url: "https://hnrss.org/frontpage", name: "Hacker News", domain: "hnrss.org" },
  { url: "https://techcrunch.com/feed/", name: "TechCrunch", domain: "techcrunch.com" },
  { url: "https://www.theverge.com/rss/index.xml", name: "The Verge", domain: "theverge.com" },
  { url: "https://www.wired.com/feed/rss", name: "Wired", domain: "wired.com" },
  { url: "https://www.reddit.com/r/technology/top/.rss?t=day", name: "r/technology", domain: "reddit.com" },
  { url: "https://www.reddit.com/r/artificial/top/.rss?t=day", name: "r/artificial", domain: "reddit.com" },
  { url: "https://www.reddit.com/r/singularity/top/.rss?t=day", name: "r/singularity", domain: "reddit.com" },
  { url: "https://www.reddit.com/r/tech/top/.rss?t=day", name: "r/tech", domain: "reddit.com" },
  { url: "https://www.reddit.com/r/MachineLearning/top/.rss?t=day", name: "r/MachineLearning", domain: "reddit.com" },
  { url: "https://www.reddit.com/r/ProductManagement/top/.rss?t=day", name: "r/ProductManagement", domain: "reddit.com" },
];

export async function fetchAllSources(): Promise<Source[]> {
  const rssPromises = RSS_SOURCES.map(({ url, name, domain }) =>
    fetchRssFeed(url, name, domain)
  );
  const rssResults = await Promise.all(rssPromises);
  const rssItems = rssResults.flat();

  const all: Source[] = [...rssItems];
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return all;
}

import Anthropic from "@anthropic-ai/sdk";
import type { RawFeedEntry } from "./feed-sources";
import type { Domain, Source } from "@/types";

const MODEL = "claude-sonnet-4-20250514";
const ALLOWED_TAGS: Domain[] = ["AI", "SaaS", "Product", "Fintech", "DevTools", "Design", "Growth"];
const BATCH_SIZE = 10;
const MAX_TOKENS = 300;

function sourceLabel(s: Source): string {
  return s === "HackerNews" ? "Hacker News" : s === "ProductHunt" ? "Product Hunt" : "Reddit";
}

function fallbackSummaryFor(entry: RawFeedEntry): string {
  const desc = entry.description?.trim();
  if (desc && desc !== entry.title) return desc;
  return `Shared on ${sourceLabel(entry.source)}. Open the link to read the full article.`;
}

export interface SummaryResult {
  summary: string;
  relevanceScore: number;
  tags: Domain[];
}

/** One API call for up to 10 items. Returns JSON array. */
async function summarizeChunk(
  apiKey: string,
  entries: RawFeedEntry[],
  selectedDomains: Domain[]
): Promise<SummaryResult[]> {
  const client = new Anthropic({ apiKey });
  const domains = selectedDomains.length ? selectedDomains.join(", ") : ALLOWED_TAGS.join(", ");
  const itemsText = entries
    .map((e, i) => `${i + 1}. ${e.title}${e.description && e.description !== e.title ? ` | ${e.description.slice(0, 80)}` : ""}`)
    .join("\n");
  const prompt = `Domains: ${domains}. Output exactly ${entries.length} lines. Each line: summary (1-2 short sentences) | score (1-10) | tags (comma-separated from: ${ALLOWED_TAGS.join(", ")}). One line per item, no other text.
${itemsText}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });
  const text =
    message.content?.find((b) => b.type === "text")?.type === "text"
      ? (message.content.find((b) => b.type === "text") as { type: "text"; text: string }).text
      : "";
  const lines = text.trim().split("\n").filter(Boolean);
  const results: SummaryResult[] = [];
  const fallbackTags = selectedDomains.length ? [selectedDomains[0]] : [];
  for (let i = 0; i < entries.length; i++) {
    const line = lines[i];
    const entry = entries[i];
    if (!line) {
      results.push({
        summary: fallbackSummaryFor(entry),
        relevanceScore: 5,
        tags: entry.tags.length > 0 ? entry.tags : fallbackTags,
      });
      continue;
    }
    const pipeSplit = line.split("|").map((s) => s.trim());
    const rawSummary = (pipeSplit[0] ?? "").replace(/^\d+\.\s*/, "").trim();
    const summary =
      rawSummary.length > 10
        ? rawSummary.slice(0, 200)
        : fallbackSummaryFor(entry);
    const scoreStr = pipeSplit[1]?.replace(/\D/g, "") ?? "5";
    const score = Math.min(10, Math.max(1, parseInt(scoreStr, 10) || 5));
    const tagStr = pipeSplit[2] ?? "";
    const tags = tagStr
      .split(",")
      .map((s) => s.trim() as Domain)
      .filter((t) => ALLOWED_TAGS.includes(t));
    results.push({
      summary,
      relevanceScore: score,
      tags: tags.length > 0 ? tags : (entry.tags.length > 0 ? entry.tags : fallbackTags),
    });
  }
  return results;
}

/** Batch: one API call per 10 items. */
export async function summarizeBatch(
  apiKey: string,
  entries: RawFeedEntry[],
  selectedDomains: Domain[]
): Promise<SummaryResult[]> {
  const out: SummaryResult[] = [];
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const chunk = entries.slice(i, i + BATCH_SIZE);
    try {
      const chunkResults = await summarizeChunk(apiKey, chunk, selectedDomains);
      out.push(...chunkResults);
    } catch {
      chunk.forEach((entry) => {
        out.push({
          summary: fallbackSummaryFor(entry),
          relevanceScore: 5,
          tags: entry.tags.length > 0 ? entry.tags : (selectedDomains.length ? [selectedDomains[0]] : []),
        });
      });
    }
  }
  return out;
}

/** One short paragraph for the week. Short prompt, low tokens. */
export async function getWeeklySummary(
  apiKey: string,
  titles: string[],
  sourceLabels: string[]
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const list = titles.slice(0, 15).map((t, i) => `${i + 1}. [${sourceLabels[i] ?? "?"}] ${t}`).join("\n");
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `2-3 sentences on what's notable this week. Punchy.\n\n${list}`,
    }],
  });
  const text =
    message.content?.find((b) => b.type === "text")?.type === "text"
      ? (message.content.find((b) => b.type === "text") as { type: "text"; text: string }).text
      : "";
  return text.trim() || "This week's top picks from your selected sources.";
}

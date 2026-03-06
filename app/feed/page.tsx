"use client";

import { useEffect, useState, useMemo, useCallback, memo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Radar, AlertCircle, ExternalLink, Newspaper, MessageCircle, ArrowUpCircle, RefreshCw, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FeedItem, Domain, Source } from "@/types";
import { cn } from "@/lib/utils";

const DOMAIN_COLORS: Record<Domain, string> = {
  AI: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  SaaS: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Product: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  Fintech: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  DevTools: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  Design: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Growth: "text-orange-400 bg-orange-500/10 border-orange-500/30",
};

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex gap-4">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}

const SOURCE_ICONS = {
  HackerNews: Newspaper,
  Reddit: MessageCircle,
  ProductHunt: ArrowUpCircle,
};

/** Format domain for display (e.g. arstechnica.com → Ars Technica) */
function domainDisplayName(domain: string): string {
  const base = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/-/g, " ");
}

/** Clearbit Logo API — no API key required. https://clearbit.com/logo */
function clearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

/** Logo for a feed item: same placement for PH, HN, Reddit (main slot); Clearbit only for non-aggregator domains */
function getItemLogoUrl(item: FeedItem): string {
  if (item.source === "ProductHunt") return "/logos/product-hunt.png";
  if (item.source === "Reddit") return "/logos/reddit.png";
  if (item.source === "HackerNews") return "/logos/hacker-news.png";
  return clearbitLogoUrl(item.sourceDomain);
}

const FeedCard = memo(function FeedCard({
  item,
  index,
  showScore,
}: {
  item: FeedItem;
  index: number;
  showScore: boolean;
}) {
  const SourceIcon = SOURCE_ICONS[item.source];
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = getItemLogoUrl(item);
  const isLocalLogo = logoUrl.startsWith("/");
  const isViaAggregator =
    item.source === "HackerNews" && item.sourceDomain !== "news.ycombinator.com";
  const sourceLabel = isViaAggregator
    ? domainDisplayName(item.sourceDomain)
    : item.source.replace(/([A-Z])/g, " $1").trim();
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={item.title}
      className="block no-underline"
    >
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "group flex flex-col rounded-xl border-2 border-border bg-card p-5 transition-all duration-200",
          "hover:border-primary/50 hover:shadow-[0_0_20px_-4px_rgba(0,212,170,0.2)] hover:-translate-y-0.5 cursor-pointer"
        )}
      >
        <div className="flex gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {!logoFailed ? (
              <Image
                src={logoUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                unoptimized={!isLocalLogo}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <SourceIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {sourceLabel}
              {isViaAggregator && (
                <span className="ml-1 font-normal normal-case opacity-90">
                  · Via Hacker News
                </span>
              )}
            </span>
            <h3 className="mt-1 min-h-[2.75rem] flex items-start gap-2 font-heading font-semibold text-foreground group-hover:text-primary group-hover:underline">
              <span className="min-w-0 flex-1 line-clamp-2">{item.title}</span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
            </h3>
          </div>
        </div>
        <p className="mt-3 min-h-[3.75rem] flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {item.summary ?? item.title}
        </p>
        <div className="mt-4 flex h-8 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {item.tags.length > 0 &&
              item.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs font-medium leading-normal",
                    DOMAIN_COLORS[tag]
                  )}
                >
                  {tag === "Product" ? "Product Mgmt" : tag}
                </span>
              ))}
          </div>
          {showScore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex shrink-0 cursor-default items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.relevanceScore}/10
                  <Info className="h-3 w-3 opacity-70" aria-hidden />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[220px]">
                AI scores how well this matches the topics you picked.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </motion.article>
    </a>
  );
});

const SOURCES: { id: Source; label: string }[] = [
  { id: "ProductHunt", label: "Product Hunt" },
  { id: "HackerNews", label: "Hacker News" },
  { id: "Reddit", label: "Reddit" },
];

const TYPEWRITER_CHARS_PER_MS = 1 / 35; // ~28 chars per second

function weeklySummaryToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function FeedContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Set<Source>>(new Set());
  const [page, setPage] = useState(1);
  const [typewriterLen, setTypewriterLen] = useState(0);

  const domainsParam = searchParams.get("domains") ?? "";
  const aiParam = searchParams.get("ai") !== "0";

  useEffect(() => {
    if (!domainsParam.trim()) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    const controller = new AbortController();
    const params = new URLSearchParams({ domains: domainsParam });
    if (!aiParam) params.set("ai", "0");
    fetch(`/api/feed?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load feed");
        return res.json();
      })
      .then((data: { items?: FeedItem[]; weeklySummary?: string | null }) => {
        setItems(data.items ?? []);
        setWeeklySummary(data.weeklySummary ?? null);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Could not load your feed. Please try again.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [domainsParam, aiParam]);

  const filteredItems = useMemo(() => {
    let list = items;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const summary = (s: string | undefined) => s ?? "";
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          summary(i.summary).toLowerCase().includes(q)
      );
    }
    if (sourceFilter.size > 0) {
      list = list.filter((i) => sourceFilter.has(i.source));
    }
    return list;
  }, [items, searchQuery, sourceFilter]);

  useEffect(() => {
    if (!weeklySummary) {
      queueMicrotask(() => setTypewriterLen(0));
      return;
    }
    queueMicrotask(() => setTypewriterLen(0));
    const len = weeklySummary.length;
    const durationMs = len / TYPEWRITER_CHARS_PER_MS;
    const intervalMs = 30;
    const step = Math.max(1, Math.ceil((len * intervalMs) / durationMs));
    const id = setInterval(() => {
      setTypewriterLen((n) => {
        if (n >= len) {
          clearInterval(id);
          return len;
        }
        return Math.min(len, n + step);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [weeklySummary]);

  const PAGE_SIZE = 10;
  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const toggleSource = useCallback((source: Source) => {
    setPage(1);
    setSourceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }, []);

  if (!domainsParam.trim()) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-90">
              <Radar className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold tracking-tight">PM Radar</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Select domains to see your feed.</p>
          <Link
            href="/select"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Choose domains →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-90">
            <Radar className="h-8 w-8 text-primary" />
            <span className="font-heading text-xl font-bold tracking-tight">PM Radar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative min-w-0 flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="text"
                placeholder="Search by keyword…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Search feed"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 border-border text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Link href="/select" className="gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden />
                Change domains
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSource(s.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  sourceFilter.has(s.id)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {weeklySummary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">This week</p>
              <p
                className="mt-2 text-base leading-relaxed text-foreground [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html: weeklySummaryToHtml(weeklySummary.slice(0, typewriterLen)),
                }}
              />
            </div>
          )}
        </div>
        <div className="my-6 border-t border-border" role="separator" aria-hidden />
        {loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            {aiParam && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Loading feed… this may take a minute when AI summaries are enabled.
              </p>
            )}
          </>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
          >
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-foreground">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedItems.map((item, i) => (
                <FeedCard key={item.id} item={item} index={(page - 1) * PAGE_SIZE + i} showScore={aiParam} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                      variant={page === p ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="h-8 min-w-8 shrink-0 p-0 font-medium"
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? "page" : undefined}
                    >
                      {p}
                    </Button>
                ))}
              </div>
            )}
          </>
        )}
        {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No items match your search or filters.
          </p>
        )}

        {!loading && !error && items.length === 0 && domainsParam && (
          <p className="text-center text-muted-foreground">
            No items in your feed yet. Try again later or change domains.
          </p>
        )}
      </main>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                PM Radar
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import type { Source } from "@/types";
import { motion } from "framer-motion";
import { SourceFavicon } from "./SourceFavicon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const DISPLAY_LIMIT = 5;
const MODAL_PAGE_SIZE = 10;

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

function SourceItemRow({
  source,
  truncateTitle = false,
}: {
  source: Source;
  truncateTitle?: boolean;
}) {
  return (
    <>
      <SourceFavicon
        domain={source.domain}
        sourceName={source.sourceName}
        size={20}
        className="h-5 w-5 shrink-0"
      />
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        title={source.title}
        className={`min-w-0 flex-1 truncate overflow-hidden text-sm text-zinc-300 underline decoration-primary/50 underline-offset-2 hover:text-primary cursor-pointer ${truncateTitle ? "max-w-0 sm:max-w-none" : ""}`}
      >
        {source.title}
      </a>
      <span className="ml-2 flex shrink-0 text-right text-xs text-zinc-500 whitespace-nowrap max-[375px]:hidden">
        {source.sourceName} · {timeAgo(source.publishedAt)}
      </span>
    </>
  );
}

function SourceItem({
  source,
  index,
  animate = true,
  summaryComplete = false,
  staggerDelayMs = 80,
}: {
  source: Source;
  index: number;
  animate?: boolean;
  summaryComplete?: boolean;
  staggerDelayMs?: number;
}) {
  const className =
    "flex min-w-0 items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04] sm:gap-3";
  if (animate) {
    return (
      <motion.li
        layout={false}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: summaryComplete ? 1 : 0,
          y: summaryComplete ? 0 : 8,
        }}
        transition={{ delay: index * (staggerDelayMs / 1000), duration: 0.25 }}
        viewport={{ once: true }}
        style={{ willChange: "transform" }}
        className={className}
      >
        <SourceItemRow source={source} truncateTitle={false} />
      </motion.li>
    );
  }
  return (
    <li className={className}>
      <SourceItemRow source={source} truncateTitle />
    </li>
  );
}

interface SourceListProps {
  sources: Source[];
  briefDate: string | null;
  summaryComplete?: boolean;
}

export function SourceList({ sources, briefDate, summaryComplete = false }: SourceListProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const displaySources = sources.slice(0, DISPLAY_LIMIT);
  const hasMore = sources.length > DISPLAY_LIMIT;

  const filtered = useMemo(() => {
    if (!search.trim()) return sources;
    const q = search.trim().toLowerCase();
    return sources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.sourceName.toLowerCase().includes(q)
    );
  }, [sources, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * MODAL_PAGE_SIZE;
    return filtered.slice(start, start + MODAL_PAGE_SIZE);
  }, [filtered, currentPage]);

  const modalDate = briefDate
    ? new Date(briefDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch("");
      setPage(1);
    }
  }, []);

  return (
    <>
      <ul className="space-y-2">
        {displaySources.map((s, i) => (
          <SourceItem
            key={`${s.url}-${s.publishedAt}-${i}`}
            source={s}
            index={i}
            animate
            summaryComplete={summaryComplete}
            staggerDelayMs={80}
          />
        ))}
      </ul>
      {hasMore && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mt-3 min-h-[44px] min-w-[44px] cursor-pointer rounded text-sm font-medium text-primary hover:underline sm:min-w-0 sm:px-1"
            >
              View all sources →
            </button>
          </DialogTrigger>
          <DialogContent className="fixed inset-x-0 bottom-0 top-auto z-50 mx-0 grid w-full max-w-none translate-x-0 translate-y-0 gap-4 overflow-hidden rounded-t-xl border-t border-zinc-800 bg-[#13131a] p-4 text-zinc-200 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:mx-4 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:p-6">
            <DialogHeader>
              <DialogTitle className="pr-8 text-lg font-semibold text-white sm:pr-0">
                All sources for {modalDate}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 min-w-0 space-y-3 overflow-hidden">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus={false}
                  readOnly
                  onFocus={(e) => e.target.removeAttribute("readonly")}
                  className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-10 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-zinc-500 hover:text-zinc-300"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
                {paginated.map((s, i) => (
                  <li
                    key={`${s.url}-${s.publishedAt}-${i}`}
                    className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04] sm:gap-3"
                  >
                    <SourceItemRow source={s} truncateTitle />
                  </li>
                ))}
              </ul>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                <span className="shrink-0 text-xs text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Source } from "@/types";
import { SourceFavicon } from "./SourceFavicon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DISPLAY_LIMIT = 5;
const MODAL_PAGE_SIZE = 10;

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** One source: title link (up to 2 lines) with source name and age underneath on phones, beside it on wider screens. */
const SourceRow = memo(function SourceRow({ source }: { source: Source }) {
  return (
    <li className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5 transition-colors hover:bg-card sm:items-center">
      <SourceFavicon domain={source.domain} sourceName={source.sourceName} size={20} className="mt-0.5 h-5 w-5 sm:mt-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 min-w-0 flex-1 text-sm text-foreground underline decoration-link/40 underline-offset-2 hover:text-link-hover hover:decoration-link-hover sm:line-clamp-1"
        >
          {source.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
          {source.sourceName} · <time dateTime={source.publishedAt}>{timeAgo(source.publishedAt)}</time>
        </span>
      </div>
    </li>
  );
});

interface SourceListProps {
  sources: Source[];
  briefDate: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SourceList({ sources, briefDate, open: controlledOpen, onOpenChange }: SourceListProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((s) => s.title.toLowerCase().includes(q) || s.sourceName.toLowerCase().includes(q));
  }, [sources, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / MODAL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * MODAL_PAGE_SIZE, currentPage * MODAL_PAGE_SIZE);

  const modalDate = briefDate
    ? new Date(briefDate + "T12:00:00Z").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "All sources";

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (controlledOpen === undefined) setInternalOpen(next);
      if (!next) {
        setSearch("");
        setPage(1);
      }
    },
    [onOpenChange, controlledOpen]
  );

  const pagerButton =
    "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <ul className="space-y-2">
        {sources.slice(0, DISPLAY_LIMIT).map((s, i) => (
          <SourceRow key={`${s.url}-${i}`} source={s} />
        ))}
      </ul>
      {sources.length > DISPLAY_LIMIT && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-md px-1 text-sm font-medium text-link underline-offset-2 hover:text-link-hover hover:underline"
            >
              View all {sources.length} sources →
            </button>
          </DialogTrigger>
          <DialogContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="sources-modal-content bg-card text-card-foreground max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:mx-0 max-sm:flex max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:flex-col max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-t-xl max-sm:p-4 sm:mx-4 sm:flex sm:max-h-[90vh] sm:max-w-2xl sm:flex-col sm:gap-0 sm:overflow-hidden sm:rounded-lg sm:p-6"
          >
            <DialogHeader className="shrink-0">
              <DialogTitle className="pr-10 text-lg font-semibold sm:pr-0">{modalDate}</DialogTitle>
              <DialogDescription className="sr-only">All sources used for this brief, with search.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="relative min-w-0 shrink-0">
                <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  aria-label="Search sources"
                  placeholder="Search sources..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-input bg-background py-2.5 pl-9 pr-10 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-1 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                )}
              </div>
              <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
                {paginated.map((s, i) => (
                  <SourceRow key={`${s.url}-${i}`} source={s} />
                ))}
                {paginated.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No sources match.</li>}
              </ul>
              <div
                className="sticky bottom-0 flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card pt-3"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
              >
                <span className="shrink-0 text-xs text-muted-foreground" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className={pagerButton}>
                    <ChevronLeft aria-hidden className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={pagerButton}
                  >
                    Next
                    <ChevronRight aria-hidden className="h-4 w-4" />
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

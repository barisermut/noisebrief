"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeParagraphs } from "@/types/brief";
import type { BriefData } from "@/lib/brief-row";
import { getTodayDateString } from "@/lib/date";
import { BriefParagraphs } from "./BriefParagraphs";
import { SummarySkeleton } from "./SummarySkeleton";
import { SourceList } from "./SourceList";
import { BriefDatePicker } from "./BriefDatePicker";
import { ThemeToggle } from "./ThemeToggle";
import { SubscribePill } from "./SubscribePill";
import { Logo } from "./Logo";

function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

interface NoisebriefContentProps {
  /** Server-loaded brief (latest on `/`, a specific date on `/brief/[date]`). */
  brief: BriefData | null;
  /** All dates that have a brief, newest first. */
  dates: string[];
}

export function NoisebriefContent({ brief, dates }: NoisebriefContentProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const briefDate = brief?.date ?? null;
  const latestDate = dates[0] ?? briefDate;
  const isHistorical = !!briefDate && briefDate !== latestDate;
  const paragraphs = normalizeParagraphs(brief?.paragraphs ?? []);

  const [scrolled, setScrolled] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [subscribeExpanded, setSubscribeExpanded] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navigateToDate = useCallback(
    (date: string) => {
      // "/" shows the latest brief; the picker's "Back to today" passes today's calendar date.
      const isLatest = date === latestDate || date === getTodayDateString();
      startTransition(() => router.push(isLatest ? "/" : `/brief/${date}`));
    },
    [router, latestDate]
  );

  const hasBrief = !!brief?.summary;

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <header
        className={`sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-shadow duration-200 ${scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.5)]" : ""}`}
      >
        <div className="relative mx-auto flex min-h-16 max-w-2xl items-center justify-between gap-2 overflow-hidden px-4 py-3">
          <div
            className={`min-w-0 transition-opacity duration-300 ${subscribeExpanded ? "pointer-events-none absolute left-4 top-3 z-0 opacity-0 sm:pointer-events-auto sm:static sm:z-auto sm:opacity-100" : ""}`}
          >
            <Link href="/" className="flex items-center gap-2 rounded-md sm:gap-3" aria-label="Noisebrief home">
              <Logo className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
              <span className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                noisebrief<span className="text-brand">.</span>
              </span>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">Today&apos;s tech noise. Briefly.</p>
          </div>
          <div className={`flex flex-col items-end gap-1 ${subscribeExpanded ? "min-w-0 flex-1" : "shrink-0"}`}>
            <SubscribePill onExpandedChange={setSubscribeExpanded} />
            <p className="text-sm text-muted-foreground">One email. Every morning.</p>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="relative z-0 mx-auto w-full min-w-0 max-w-2xl flex-1 px-4 pb-4 pt-6 outline-none">
        <section aria-labelledby={hasBrief ? "brief-title" : undefined} className="mb-6 mt-1 min-w-0">
          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
            <p className="font-heading shrink-0 text-base font-semibold text-muted-foreground sm:text-lg">
              {isHistorical ? "Past brief" : "Latest brief"}
            </p>
            {hasBrief && briefDate && (
              <>
                <time
                  dateTime={briefDate}
                  className="shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {formatDate(briefDate, { month: "short", day: "numeric" })}
                </time>
                <BriefDatePicker
                  selectedDate={briefDate}
                  isHistorical={isHistorical}
                  onSelectDate={navigateToDate}
                  dates={dates}
                  open={datePickerOpen}
                  onOpenChange={setDatePickerOpen}
                />
              </>
            )}
          </div>

          <div aria-live="polite" aria-busy={isNavigating}>
            {isNavigating && <SummarySkeleton />}
            {!isNavigating && hasBrief && (
              <article className="min-w-0">
                <div className="mb-3 mt-4 sm:mb-4 sm:mt-6">
                  {briefDate && (
                    <p className="mb-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                      {isHistorical
                        ? formatDate(briefDate, { weekday: "long", month: "long", day: "numeric" })
                        : "Today's brief"}
                    </p>
                  )}
                  {brief.title && (
                    <h1 id="brief-title" className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                      {brief.title}
                    </h1>
                  )}
                </div>
                <BriefParagraphs paragraphs={paragraphs} />
              </article>
            )}
            {!isNavigating && !hasBrief && (
              <p className="text-sm text-muted-foreground">No brief yet. Check back after the daily run.</p>
            )}
          </div>
        </section>

        {!isNavigating && brief && brief.sources.length > 0 && (
          <section aria-labelledby="sources-heading" className="mb-6 mt-8 min-w-0 sm:mt-6">
            <h2 id="sources-heading" className="mb-3 text-sm font-medium text-muted-foreground">
              Sources · {brief.sources.length}
              {isHistorical ? "" : " today"}
            </h2>
            <SourceList
              sources={brief.sources}
              briefDate={brief.date}
              open={sourcesOpen}
              onOpenChange={setSourcesOpen}
            />
          </section>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-1 border-t border-border px-4 py-5 text-sm text-muted-foreground">
        <span className="inline-flex min-h-6 items-center">
          Built by&nbsp;
          <a href="https://barisermut.com" target="_blank" rel="noopener noreferrer" className="text-link underline-offset-2 hover:text-link-hover hover:underline">
            Barış Ermut
          </a>
        </span>
        <span aria-hidden className="select-none px-1">·</span>
        <Link href="/privacy" className="inline-flex min-h-6 items-center underline-offset-2 hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden className="select-none px-1">·</span>
        <ThemeToggle />
      </footer>
    </div>
  );
}

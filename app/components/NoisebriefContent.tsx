"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { normalizeParagraphs } from "@/types/brief";
import { TypewriterSummary } from "./TypewriterSummary";
import { AnimatedParagraphs } from "./AnimatedParagraphs";
import { SummarySkeleton } from "./SummarySkeleton";
import { SourceList } from "./SourceList";
import { BriefDatePicker } from "./BriefDatePicker";
import { ThemeToggle } from "./ThemeToggle";
import { SubscribePill } from "./SubscribePill";
import { useBrief } from "./BriefProvider";

function formatBriefDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
}

export function NoisebriefContent() {
  const {
    brief,
    loading,
    error,
    summaryComplete,
    sourcesRevealed,
    restoredFromCache,
    handleSummaryComplete,
    selectedDate,
    isHistorical,
    navigateToDate,
    availableDates,
    availableDatesLoading,
  } = useBrief();

  const normalizedParagraphs = useMemo(
    () => normalizeParagraphs(brief?.paragraphs ?? []),
    [brief?.paragraphs]
  );

  const briefDateBadge = useMemo(
    () =>
      brief?.date
        ? new Date(brief.date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : null,
    [brief?.date]
  );

  const [scrolled, setScrolled] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [subscribeExpanded, setSubscribeExpanded] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <main className="flex-1 min-w-0">
        <header
          className={`sticky top-0 z-40 w-full bg-background/95 dark:bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-black/8 dark:border-white/8 transition-shadow duration-200 ${scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.35)]" : ""}`}
        >
          <div className="relative max-w-2xl mx-auto flex items-center justify-between gap-2 px-4 pt-3 pb-3 min-h-16 overflow-hidden">
            <div
              className={`min-w-0 transition-opacity duration-300 ${subscribeExpanded ? "absolute left-4 top-3 z-0 opacity-0 pointer-events-none sm:static sm:opacity-100 sm:pointer-events-auto sm:z-auto" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <svg
                  aria-hidden="true"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
                >
                  <path
                    d="M7 6H11.5L16 13.5V6H20.5V26H16.5L11.5 17.5V26H7V6Z"
                    fill="#00d4aa"
                  />
                  <path
                    d="M22 11 Q25 13.5 25 16 Q25 18.5 22 21"
                    stroke="#00d4aa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.9"
                  />
                  <path
                    d="M23.5 8.5 Q28 12 28 16 Q28 20 23.5 23.5"
                    stroke="#00d4aa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                  <path
                    d="M25 6 Q31 10.5 31 16 Q31 21.5 25 26"
                    stroke="#00d4aa"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.25"
                  />
                </svg>
                <h1
                  className="font-heading text-2xl font-bold tracking-tight text-[#1a1a1a] dark:text-white sm:text-3xl md:text-4xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  noisebrief<span style={{ color: "#00d4aa" }}>.</span>
                </h1>
              </div>
              <p className="mt-1 break-words text-sm text-foreground/40">
                Today&apos;s tech noise. Briefly.
              </p>
            </div>
            <div className={`flex flex-col items-end gap-1 ${subscribeExpanded ? "flex-1 min-w-0" : "shrink-0"}`}>
              <SubscribePill onExpandedChange={setSubscribeExpanded} />
              <p className="text-sm text-foreground/40">One email. Every morning.</p>
            </div>
          </div>
        </header>

        <div className="relative z-0 mx-auto min-w-0 max-w-2xl px-4 pb-4 pt-6 sm:px-4">
      <section className="mb-6 min-w-0 mt-1">
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
          <h2
            className="font-heading shrink-0 text-base font-semibold text-[#6b6b6b] dark:text-zinc-400 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Latest Brief
          </h2>
          {!loading && !error && brief?.summary && briefDateBadge && (
            <>
              <span className="shrink-0 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs font-medium text-[#1a1a1a]/80 ring-1 ring-teal-500/30 dark:border-white/10 dark:bg-[#1a1a2e] dark:text-white/80">
                {briefDateBadge}
              </span>
              <BriefDatePicker
                selectedDate={selectedDate}
                isHistorical={isHistorical}
                onSelectDate={navigateToDate}
                dates={availableDates}
                loadingDates={availableDatesLoading}
                open={datePickerOpen}
                onOpenChange={setDatePickerOpen}
              />
            </>
          )}
        </div>
        {loading && <SummarySkeleton />}
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
          {!loading && !error && brief?.summary && (
            <div className="min-w-0">
            <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
              {brief.date && (
                <p className="text-sm font-medium tracking-widest uppercase text-foreground/40 mb-1">
                  {isHistorical ? formatBriefDateLabel(brief.date) : "TODAY'S BRIEF"}
                </p>
              )}
              {brief.title && (
                <h3
                  className="font-heading text-2xl font-bold leading-tight text-[#1a1a1a] dark:text-white sm:text-3xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {brief.title}
                </h3>
              )}
            </div>
            {(restoredFromCache || isHistorical) ? (
              normalizedParagraphs.length > 0 ? (
                <AnimatedParagraphs
                  paragraphs={normalizedParagraphs}
                  animate={false}
                />
              ) : (
                <div className="space-y-6 text-base leading-relaxed text-[#1a1a1a] dark:text-white/80 sm:text-lg sm:leading-relaxed">
                  <p>{brief.summary}</p>
                </div>
              )
            ) : normalizedParagraphs.length > 0 ? (
              <AnimatedParagraphs
                paragraphs={normalizedParagraphs}
                animate={true}
                onComplete={handleSummaryComplete}
              />
            ) : (
              <div className="text-base leading-relaxed text-[#1a1a1a] dark:text-white/80 sm:text-lg sm:leading-relaxed">
                <TypewriterSummary
                  text={brief.summary}
                  onComplete={handleSummaryComplete}
                />
              </div>
            )}
          </div>
        )}
        {!loading && !error && brief && !brief.summary && brief.sources.length === 0 && (
          <p className="text-sm text-[#6b6b6b] dark:text-zinc-500">
            No brief yet. Check back after the daily run.
          </p>
        )}
      </section>

      {brief && brief.sources.length > 0 && (
        <section
          className={`mt-8 sm:mt-6 mb-6 min-w-0 section-reveal ${(summaryComplete || isHistorical) ? "section-reveal-visible" : ""}`}
        >
          <h2 className="mb-3 text-sm text-foreground/60">
            Sources  ·  {brief.sources.length} today
          </h2>
          <SourceList
            sources={brief.sources}
            briefDate={brief.date}
            summaryComplete={summaryComplete}
            isHistorical={isHistorical}
            open={sourcesOpen}
            onOpenChange={setSourcesOpen}
          />
        </section>
      )}

      {/* MAKE IT YOURS — disabled (tone selector, LinkedIn-style posts, floating CTA). Restore from git. */}

        </div>
      </main>
      {/* Floating “Make it yours” CTA removed with MAKE IT YOURS feature. */}
      <footer className="border-t border-zinc-200 dark:border-white/5 px-4 py-6 text-center text-xs text-foreground/50 sm:text-xs">
        <span>
          Built by{" "}
          <a
            href="https://barisermut.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:underline text-teal-600 dark:text-teal-400"
          >
            Barış Ermut
          </a>
        </span>
        <span className="select-none mx-1.5" aria-hidden>·</span>
        <Link
          href="/privacy"
          className="cursor-pointer hover:underline text-inherit"
        >
          Privacy Policy
        </Link>
        <span className="select-none mx-1.5" aria-hidden>·</span>
        <ThemeToggle />
      </footer>
    </div>
  );
}

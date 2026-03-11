"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Tone } from "@/types";
import { TypewriterSummary } from "./TypewriterSummary";
import { TypewriterParagraphs } from "./TypewriterParagraphs";
import { SummarySkeleton } from "./SummarySkeleton";
import { SourceList } from "./SourceList";
import { ToneSelector } from "./ToneSelector";
import { GeneratedPost } from "./GeneratedPost";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { BriefDatePicker } from "./BriefDatePicker";
import { ThemeToggle } from "./ThemeToggle";
import { useBrief } from "./BriefProvider";

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return d.toLocaleDateString();
}

export function NoisebriefContent() {
  const {
    brief,
    loading,
    error,
    summaryComplete,
    skipRequested,
    sourcesRevealed,
    restoredFromCache,
    skipRef,
    selectedTone,
    postCache,
    generatingTone,
    generateError,
    makeItYoursVisible,
    handleSummaryComplete,
    handleToneSelect,
    setSkipRequested,
    setSummaryComplete,
    setSourcesRevealed,
    selectedDate,
    isHistorical,
    navigateToDate,
  } = useBrief();

  const displayPost =
    selectedTone !== null ? postCache.get(selectedTone) ?? null : null;

  const updatedAtLabel = useMemo(
    () => (brief?.generatedAt ? formatUpdatedAt(brief.generatedAt) : ""),
    [brief?.generatedAt]
  );
  const updatedDateFormatted = useMemo(
    () =>
      brief?.generatedAt
        ? new Date(brief.generatedAt).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
    [brief?.generatedAt]
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

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <main className="flex-1 min-w-0">
        <div className="relative z-0 mx-auto min-w-0 max-w-2xl px-4 pb-4 pt-6 sm:px-4">
          <header className="mb-4 min-w-0">
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
            Noisebrief
          </h1>
        </div>
        <p className="mt-1 break-words text-sm text-[#6b6b6b] dark:text-zinc-500">
          Today&apos;s tech noise. Briefly.
        </p>
        {!loading && !error && brief?.generatedAt && (
          <p className="mt-1 break-words text-xs text-[#6b6b6b] dark:text-zinc-500">
            Updated {updatedDateFormatted} · {updatedAtLabel}
            {" · "}
            <span className="text-[#6b6b6b] dark:text-zinc-600">A fresh brief drops every day at 8AM UTC</span>
          </p>
        )}
      </header>

      <section className="mb-6 min-w-0">
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2
              className="font-heading shrink-0 text-base font-semibold text-[#6b6b6b] dark:text-zinc-400 sm:text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Latest Brief
            </h2>
            {!loading && !error && brief?.summary && briefDateBadge && (
              <>
                <span className="shrink-0 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs font-medium text-[#1a1a1a]/80 dark:border-white/10 dark:bg-[#1a1a2e] dark:text-white/80">
                  {briefDateBadge}
                </span>
                <BriefDatePicker
                  selectedDate={selectedDate}
                  isHistorical={isHistorical}
                  onSelectDate={navigateToDate}
                />
              </>
            )}
          </div>
          <div className="flex items-center self-center min-w-0 shrink-0 gap-2">
            {!loading && !error && brief?.summary && !summaryComplete && !restoredFromCache && !isHistorical && (
              <button
                type="button"
                onClick={() => {
                  skipRef.current = true;
                  setSkipRequested(true);
                  setSummaryComplete(true);
                  setSourcesRevealed(true);
                }}
                className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded text-sm text-[#6b6b6b] transition-colors hover:text-[#00d4aa] dark:text-zinc-500 sm:min-w-0 sm:px-2"
              >
                Skip animation →
              </button>
            )}
            {!loading && !error && brief?.summary && (summaryComplete || restoredFromCache || isHistorical) && (
              <button
                type="button"
                onClick={() => document.getElementById("make-it-yours")?.scrollIntoView({ behavior: "smooth" })}
                className="hidden min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded text-sm text-[#6b6b6b] transition-colors hover:text-[#00d4aa] dark:text-zinc-500 sm:min-w-0 sm:px-2 md:inline-block"
                style={{
                  transition: "opacity 0.3s ease",
                  opacity: makeItYoursVisible || isHistorical ? 1 : 0,
                  pointerEvents: makeItYoursVisible || isHistorical ? "auto" : "none",
                }}
              >
                Make it yours ↓
              </button>
            )}
          </div>
        </div>
        {!loading && !error && brief?.summary && (summaryComplete || restoredFromCache || isHistorical) && (
          <div className="mb-3 flex md:hidden">
            <button
              type="button"
              onClick={() => document.getElementById("make-it-yours")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded text-left text-sm text-[#6b6b6b] transition-colors hover:text-[#00d4aa] dark:text-zinc-500 sm:min-w-0 sm:px-0"
              style={{
                transition: "opacity 0.3s ease",
                opacity: makeItYoursVisible || isHistorical ? 1 : 0,
                pointerEvents: makeItYoursVisible || isHistorical ? "auto" : "none",
              }}
            >
              Make it yours ↓
            </button>
          </div>
        )}
        {loading && <SummarySkeleton />}
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
          {!loading && !error && brief?.summary && (
            <div className="min-w-0 space-y-4">
            {brief.title && (
              <h3
                className="font-heading text-2xl font-bold leading-tight text-[#1a1a1a] dark:text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {brief.title}
              </h3>
            )}
            {(restoredFromCache || isHistorical) ? (
              <div className="text-base leading-relaxed text-[#1a1a1a] dark:text-zinc-300 sm:text-lg sm:leading-relaxed">
                {brief.paragraphs.length > 0 ? (
                  brief.paragraphs.map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))
                ) : (
                  <p>{brief.summary}</p>
                )}
              </div>
            ) : brief.paragraphs.length > 0 ? (
              <div className="text-base leading-relaxed text-[#1a1a1a] dark:text-zinc-300 sm:text-lg sm:leading-relaxed">
                <TypewriterParagraphs
                  paragraphs={brief.paragraphs}
                  onComplete={handleSummaryComplete}
                  skipToEnd={skipRequested}
                  skipRef={skipRef}
                />
              </div>
            ) : (
              <div className="text-base leading-relaxed text-[#1a1a1a] dark:text-zinc-300 sm:text-lg sm:leading-relaxed">
                <TypewriterSummary
                  text={brief.summary}
                  onComplete={handleSummaryComplete}
                  skipToEnd={skipRequested}
                  skipRef={skipRef}
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
          className={`mb-6 min-w-0 section-reveal ${(summaryComplete || isHistorical) ? "section-reveal-visible" : ""}`}
        >
          <h2
            className="mb-3 font-heading text-base font-semibold text-[#6b6b6b] dark:text-zinc-400 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Where we looked
          </h2>
          <SourceList
            sources={brief.sources}
            briefDate={brief.date}
            summaryComplete={summaryComplete}
            isHistorical={isHistorical}
          />
        </section>
      )}

      {brief?.summary && (
        <section
          className={`mb-6 min-w-0 section-reveal ${(sourcesRevealed || isHistorical) ? "section-reveal-visible" : ""}`}
        >
          <h2
            id="make-it-yours"
            className="mb-0 font-heading text-base font-semibold text-[#6b6b6b] dark:text-zinc-400 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Make it yours
          </h2>
          <p className="mb-3 text-sm text-[#6b6b6b] dark:text-zinc-500">
            Choose your tone, get today's brief ready to share. Posts are AI-generated from the same summary. Edit before you post.
          </p>
          <ToneSelector
            selected={selectedTone}
            onSelect={handleToneSelect}
            loading={generatingTone !== null}
          />
          {generateError && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{generateError}</p>
          )}
          <div className="mt-4">
            {selectedTone &&
              (generatingTone === selectedTone ? (
                <PostCardSkeleton />
              ) : displayPost ? (
                <GeneratedPost post={displayPost} />
              ) : null)}
          </div>
        </section>
      )}

        </div>
      </main>
      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-[#6b6b6b] dark:border-white/5 dark:text-zinc-600 sm:text-sm">
        <p className="flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-1 break-words">
          Built by{" "}
          <a
            href="https://barisermut.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-primary hover:underline min-h-[44px] min-w-0 inline-flex items-center justify-center"
          >
            Barış Ermut
          </a>
          <span className="shrink-0">·</span>
          <ThemeToggle />
          <Link
            href="/privacy"
            className="cursor-pointer text-[#6b6b6b] transition-colors hover:text-foreground dark:text-zinc-500 dark:hover:text-white min-h-[44px] min-w-0 inline-flex items-center justify-center"
          >
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}

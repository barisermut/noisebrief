"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Source, Tone } from "@/types";
import { TypewriterSummary } from "./TypewriterSummary";
import { TypewriterParagraphs } from "./TypewriterParagraphs";
import { SummarySkeleton } from "./SummarySkeleton";
import { SourceList } from "./SourceList";
import { ToneSelector } from "./ToneSelector";
import { GeneratedPost } from "./GeneratedPost";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { motion } from "framer-motion";

interface BriefData {
  title: string | null;
  summary: string;
  paragraphs: string[];
  sources: Source[];
  generatedAt: string | null;
  date: string | null;
  isFallback?: boolean;
}

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

// sessionStorage: same-session navigation UX only (restore brief/posts on same-day revisit)
const BRIEF_STORAGE_KEY = "noisebrief_brief";
const POSTS_STORAGE_KEY = "noisebrief_posts";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadBriefFromStorage(): BriefData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BRIEF_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as BriefData;
    if (!data || typeof data.date !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

function loadPostsFromStorage(): Map<Tone, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = sessionStorage.getItem(POSTS_STORAGE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    if (!obj || typeof obj !== "object") return new Map();
    return new Map(Object.entries(obj)) as Map<Tone, string>;
  } catch {
    return new Map();
  }
}

export function NoisebriefContent() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryComplete, setSummaryComplete] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const [sourcesRevealed, setSourcesRevealed] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);
  const skipRef = useRef(false);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [postCache, setPostCache] = useState<Map<Tone, string>>(new Map());
  const postCacheRef = useRef<Map<Tone, string>>(postCache);
  postCacheRef.current = postCache;
  const [generatingTone, setGeneratingTone] = useState<Tone | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [makeItYoursVisible, setMakeItYoursVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("make-it-yours");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setMakeItYoursVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [brief?.summary, sourcesRevealed]);

  const fetchBrief = useCallback(async () => {
    try {
      const res = await fetch("/api/brief/today");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load brief");
      const nextBrief: BriefData = {
        title: data.title ?? null,
        summary: data.summary ?? "",
        paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [],
        sources: data.sources ?? [],
        generatedAt: data.generatedAt ?? null,
        date: data.date ?? null,
        isFallback: data.isFallback === true,
      };
      setBrief(nextBrief);
      setError(null);
      setSummaryComplete(false);
      setSkipRequested(false);
      setRestoredFromCache(false);
      skipRef.current = false;
      setSourcesRevealed(false);
      setPostCache(new Map());
      try {
        sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(nextBrief));
        sessionStorage.removeItem(POSTS_STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch (e) {
      console.error("Brief fetch error:", e);
      setError("Something went wrong loading today's brief. Please refresh.");
      setBrief({
        title: null,
        summary: "",
        paragraphs: [],
        sources: [],
        generatedAt: null,
        date: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = loadBriefFromStorage();
    const today = getTodayDateString();
    if (cached?.date === today && cached.summary) {
      setBrief(cached);
      setSummaryComplete(true);
      setSkipRequested(true);
      setRestoredFromCache(true);
      skipRef.current = true;
      setSourcesRevealed(true);
      setPostCache(loadPostsFromStorage());
      setLoading(false);
      return;
    }
    fetchBrief();
  }, [fetchBrief]);

  useEffect(() => {
    if (postCache.size === 0) return;
    try {
      sessionStorage.setItem(
        POSTS_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(postCache))
      );
    } catch {
      // ignore
    }
  }, [postCache]);

  useEffect(() => {
    if (!summaryComplete || !brief?.sources.length) return;
    const count = Math.min(brief.sources.length, 5);
    const delay = 300 + count * 80;
    const t = setTimeout(() => setSourcesRevealed(true), delay);
    return () => clearTimeout(t);
  }, [summaryComplete, brief?.sources.length]);

  const handleToneSelect = useCallback(
    async (tone: Tone) => {
      setSelectedTone(tone);
      setGenerateError(null);

      const cached = postCacheRef.current.get(tone);
      if (cached) return;

      if (!brief?.date) {
        setGenerateError("No brief date available.");
        return;
      }

      setGeneratingTone(tone);
      try {
        const res = await fetch("/api/post/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone,
            summary: brief.summary,
            briefDate: brief.date,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to generate");
        setPostCache((prev) => new Map(prev).set(tone, data.post));
      } catch (e) {
        console.error("LinkedIn generate error:", e);
        setGenerateError("Couldn't generate the post. Please try again.");
      } finally {
        setGeneratingTone(null);
      }
    },
    [brief?.summary, brief?.date]
  );

  const displayPost =
    selectedTone !== null ? postCache.get(selectedTone) ?? null : null;

  const updatedAtLabel = brief?.generatedAt
    ? formatUpdatedAt(brief.generatedAt)
    : "";
  const updatedDateFormatted = brief?.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const briefDateBadge =
    brief?.date &&
    new Date(brief.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
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
            className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Noisebrief
          </h1>
        </div>
        <p className="mt-1 break-words text-sm text-zinc-500">
          Today&apos;s tech noise. Briefly.
        </p>
        {!loading && !error && brief?.generatedAt && (
          <p className="mt-1 break-words text-xs text-zinc-500">
            Updated {updatedDateFormatted} · {updatedAtLabel}
            {" · "}
            <span className="text-zinc-600">A fresh brief drops every day at 8AM UTC</span>
          </p>
        )}
      </header>

      <section className="mb-6 min-w-0">
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2
              className="font-heading shrink-0 text-base font-semibold text-zinc-400 sm:text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Latest Brief
            </h2>
            {!loading && !error && brief?.summary && briefDateBadge && (
              <span className="shrink-0 rounded border border-white/10 bg-[#1a1a2e] px-1.5 py-0.5 text-xs font-medium text-white/80">
                {briefDateBadge}
              </span>
            )}
          </div>
          {!loading && !error && brief?.summary && !summaryComplete && !restoredFromCache && (
            <button
              type="button"
              onClick={() => {
                skipRef.current = true;
                setSkipRequested(true);
                setSummaryComplete(true);
                setSourcesRevealed(true);
              }}
              className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded text-sm text-zinc-500 transition-colors hover:text-[#00d4aa] sm:min-w-0 sm:px-2"
            >
              Skip animation →
            </button>
          )}
          {!loading && !error && brief?.summary && (summaryComplete || restoredFromCache) && !makeItYoursVisible && (
            <button
              type="button"
              onClick={() => document.getElementById("make-it-yours")?.scrollIntoView({ behavior: "smooth" })}
              className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded text-sm text-zinc-500 transition-colors hover:text-[#00d4aa] sm:min-w-0 sm:px-2"
            >
              Make it yours ↓
            </button>
          )}
        </div>
        {loading && <SummarySkeleton />}
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        {!loading && !error && brief?.summary && (
          <div className="min-w-0 space-y-4">
            {brief.title && (
              <h3
                className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {brief.title}
              </h3>
            )}
            {restoredFromCache ? (
              <div className="text-base leading-relaxed text-zinc-300 sm:text-lg sm:leading-relaxed">
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
              <div className="text-base leading-relaxed text-zinc-300 sm:text-lg sm:leading-relaxed">
                <TypewriterParagraphs
                  paragraphs={brief.paragraphs}
                  onComplete={() => setSummaryComplete(true)}
                  skipToEnd={skipRequested}
                  skipRef={skipRef}
                />
              </div>
            ) : (
              <div className="text-base leading-relaxed text-zinc-300 sm:text-lg sm:leading-relaxed">
                <TypewriterSummary
                  text={brief.summary}
                  onComplete={() => setSummaryComplete(true)}
                  skipToEnd={skipRequested}
                  skipRef={skipRef}
                />
              </div>
            )}
          </div>
        )}
        {!loading && !error && brief && !brief.summary && brief.sources.length === 0 && (
          <p className="text-sm text-zinc-500">
            No brief yet. Check back after the daily run.
          </p>
        )}
      </section>

      {brief && brief.sources.length > 0 && (
        <motion.section
          className="mb-6 min-w-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: summaryComplete ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2
            className="mb-3 font-heading text-base font-semibold text-zinc-400 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Where we looked
          </h2>
          <SourceList
            sources={brief.sources}
            briefDate={brief.date}
            summaryComplete={summaryComplete}
          />
        </motion.section>
      )}

      {brief?.summary && (
        <motion.section
          className="mb-6 min-w-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: sourcesRevealed ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2
            id="make-it-yours"
            className="mb-0 font-heading text-base font-semibold text-zinc-400 sm:text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Make it yours
          </h2>
          <p className="mb-3 text-sm text-zinc-500">
            Choose your tone, get today's brief ready to share. Posts are AI-generated from the same summary. Edit before you post.
          </p>
          <ToneSelector
            selected={selectedTone}
            onSelect={handleToneSelect}
            loading={generatingTone !== null}
          />
          {generateError && (
            <p className="mt-2 text-sm text-red-400">{generateError}</p>
          )}
          {selectedTone && (
            <div className="mt-4">
              {generatingTone === selectedTone ? (
                <PostCardSkeleton />
              ) : displayPost ? (
                <GeneratedPost post={displayPost} />
              ) : null}
            </div>
          )}
        </motion.section>
      )}

        </div>
      </main>
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-600 sm:text-sm">
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
          <Link
            href="/privacy"
            className="cursor-pointer text-zinc-500 transition-colors hover:text-white min-h-[44px] min-w-0 inline-flex items-center justify-center"
          >
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}

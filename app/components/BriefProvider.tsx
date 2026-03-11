"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Source, Tone } from "@/types";

export interface BriefData {
  title: string | null;
  summary: string;
  paragraphs: string[];
  sources: Source[];
  generatedAt: string | null;
  date: string | null;
  isFallback?: boolean;
}

const BRIEF_STORAGE_KEY = "noisebrief_brief";
const POSTS_STORAGE_KEY = "noisebrief_posts";
/** In-memory cache of briefs by date (YYYY-MM-DD) to avoid refetch flash when switching dates. */
const briefCache = new Map<string, BriefData>();

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

interface BriefContextValue {
  brief: BriefData | null;
  loading: boolean;
  error: string | null;
  summaryComplete: boolean;
  skipRequested: boolean;
  sourcesRevealed: boolean;
  restoredFromCache: boolean;
  skipRef: React.MutableRefObject<boolean>;
  selectedTone: Tone | null;
  setSelectedTone: (tone: Tone | null) => void;
  postCache: Map<Tone, string>;
  generatingTone: Tone | null;
  generateError: string | null;
  makeItYoursVisible: boolean;
  handleSummaryComplete: () => void;
  handleToneSelect: (tone: Tone) => void;
  setSkipRequested: (v: boolean) => void;
  setSummaryComplete: (v: boolean) => void;
  setSourcesRevealed: (v: boolean) => void;
  /** Current date from URL: today (/) or YYYY-MM-DD (/brief/YYYY-MM-DD). */
  selectedDate: string;
  /** True when viewing a past date (no typewriter). */
  isHistorical: boolean;
  /** Navigate to a brief by date; use today string for home. */
  navigateToDate: (date: string) => void;
}

const BriefContext = createContext<BriefContextValue | null>(null);

export function useBrief(): BriefContextValue {
  const ctx = useContext(BriefContext);
  if (!ctx) {
    throw new Error("useBrief must be used within BriefProvider");
  }
  return ctx;
}

export function BriefProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  const today = getTodayDateString();
  // URL is source of truth. Phase 7 can add category (e.g. /brief/YYYY-MM-DD?category=tech) without changing this shape.
  const selectedDate = useMemo(() => {
    if (pathname === "/") return today;
    const m = pathname.match(/^\/brief\/(\d{4}-\d{2}-\d{2})$/);
    return m ? m[1] : today;
  }, [pathname, today]);
  const isHistorical = selectedDate !== today;

  const navigateToDate = useCallback(
    (date: string) => {
      if (date === today) router.push("/");
      else router.push(`/brief/${date}`);
    },
    [router, today]
  );

  useEffect(() => {
    if (sourcesRevealed) {
      const t = setTimeout(() => setMakeItYoursVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [sourcesRevealed]);

  const applyBrief = useCallback((nextBrief: BriefData, fromCache: boolean) => {
    setBrief(nextBrief);
    setError(null);
    setSummaryComplete(fromCache);
    setSkipRequested(fromCache);
    setRestoredFromCache(fromCache);
    skipRef.current = fromCache;
    setSourcesRevealed(fromCache);
    setMakeItYoursVisible(fromCache);
    setPostCache(new Map());
  }, []);

  const fetchBriefForDate = useCallback(
    async (date: string) => {
      const cached = briefCache.get(date);
      if (cached) {
        applyBrief(cached, true);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setBrief(null);
      setSummaryComplete(false);
      setSkipRequested(false);
      setRestoredFromCache(false);
      skipRef.current = false;
      setSourcesRevealed(false);
      setMakeItYoursVisible(false);
      setPostCache(new Map());

      const isToday = date === today;
      const url = isToday ? "/api/brief/today" : `/api/brief/${date}`;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
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
        briefCache.set(date, nextBrief);
        applyBrief(nextBrief, false);
        if (isToday) {
          try {
            sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(nextBrief));
            sessionStorage.removeItem(POSTS_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("Brief fetch error:", e);
        }
        const message =
          e instanceof Error && e.name === "AbortError"
            ? "Request took too long. Please refresh."
            : "Something went wrong loading the brief. Please refresh.";
        setError(message);
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
    },
    [today, applyBrief]
  );

  useEffect(() => {
    if (selectedDate === today) {
      const cached = loadBriefFromStorage();
      if (cached?.date === today && cached.summary) {
        briefCache.set(today, cached);
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
    }
    fetchBriefForDate(selectedDate);
  }, [selectedDate, today, fetchBriefForDate]);

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

  const handleSummaryComplete = useCallback(() => setSummaryComplete(true), []);

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
          signal: AbortSignal.timeout(35_000),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to generate");
        setPostCache((prev) => new Map(prev).set(tone, data.post));
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("LinkedIn generate error:", e);
        }
        const message =
          e instanceof Error && e.name === "AbortError"
            ? "Request took too long. Please try again."
            : "Couldn't generate the post. Please try again.";
        setGenerateError(message);
      } finally {
        setGeneratingTone(null);
      }
    },
    [brief?.summary, brief?.date]
  );

  const value: BriefContextValue = useMemo(
    () => ({
      brief,
      loading,
      error,
      summaryComplete,
      skipRequested,
      sourcesRevealed,
      restoredFromCache,
      skipRef,
      selectedTone,
      setSelectedTone,
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
    }),
    [
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
      selectedDate,
      isHistorical,
      navigateToDate,
    ]
  );

  return (
    <BriefContext.Provider value={value}>{children}</BriefContext.Provider>
  );
}

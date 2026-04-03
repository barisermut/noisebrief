"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizeBriefRowFields } from "@/lib/brief-row";
import type { ParagraphsField, Source } from "@/types";

export interface BriefData {
  title: string | null;
  summary: string;
  paragraphs: ParagraphsField;
  sources: Source[];
  generatedAt: string | null;
  date: string | null;
  isFallback?: boolean;
}

/** Bumped when stored shape can be stale (e.g. bad JSON brief cached client-side). */
const BRIEF_STORAGE_KEY = "noisebrief_brief_v2";
// MAKE IT YOURS — disabled: const POSTS_STORAGE_KEY = "noisebrief_posts";
/** In-memory cache of briefs by date (YYYY-MM-DD) to avoid refetch flash when switching dates. */
const briefCache = new Map<string, BriefData>();

import { getTodayDateString } from "@/lib/date";

/** Same repair as API routes so sessionStorage / briefCache never bypasses fixes. */
function repairBriefData(data: BriefData): BriefData {
  const n = normalizeBriefRowFields({
    title: data.title,
    summary: data.summary,
    paragraphs: data.paragraphs,
  });
  const paras =
    n.paragraphs.length > 0
      ? n.paragraphs
      : n.summary
        ? [n.summary]
        : [];
  return {
    ...data,
    title: n.title,
    summary: n.summary,
    paragraphs: paras,
  };
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

/* MAKE IT YOURS — disabled
function loadPostsFromStorage(): Map<Tone, string> { ... }
*/

interface BriefContextValue {
  brief: BriefData | null;
  loading: boolean;
  error: string | null;
  summaryComplete: boolean;
  sourcesRevealed: boolean;
  restoredFromCache: boolean;
  handleSummaryComplete: () => void;
  setSummaryComplete: (v: boolean) => void;
  setSourcesRevealed: (v: boolean) => void;
  /** Current date from URL: today (/) or YYYY-MM-DD (/brief/YYYY-MM-DD). */
  selectedDate: string;
  /** True when viewing a date that is not the latest available (no typewriter). */
  isHistorical: boolean;
  /** Navigate to a brief by date; use today string for home. */
  navigateToDate: (date: string) => void;
  /** All dates that have a brief, sorted descending. */
  availableDates: string[];
  /** True while the available-dates request is in flight. */
  availableDatesLoading: boolean;
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

  const today = getTodayDateString();
  const [latestAvailableDate, setLatestAvailableDate] = useState(today);
  const [availableDatesLoaded, setAvailableDatesLoaded] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryComplete, setSummaryComplete] = useState(false);
  const [sourcesRevealed, setSourcesRevealed] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);

  // Restore from sessionStorage before browser paint to prevent typewriter replay.
  // useLayoutEffect runs after hydration but before the browser paints,
  // so initial state matches the server (no hydration mismatch) and the
  // user never sees a loading flash.
  const syncRestoreDone = useRef(false);
  useLayoutEffect(() => {
    if (syncRestoreDone.current) return;
    syncRestoreDone.current = true;
    const stored = loadBriefFromStorage();
    if (!stored?.date || !stored?.summary) return;
    const urlMatch = pathname.match(/^\/brief\/(\d{4}-\d{2}-\d{2})$/);
    const wantedDate = urlMatch ? urlMatch[1] : today;
    if (stored.date !== wantedDate) return;
    const repaired = repairBriefData(stored);
    briefCache.set(stored.date, repaired);
    setBrief(repaired);
    setSummaryComplete(true);
    setRestoredFromCache(true);
    setSourcesRevealed(true);
    setLoading(false);
    try {
      sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(repaired));
    } catch {
      // ignore
    }
  }, [today, pathname]);

  // URL is source of truth on load; when path is "/", selected date is latest available brief (not calendar today)
  const selectedDate = useMemo(() => {
    const m = pathname.match(/^\/brief\/(\d{4}-\d{2}-\d{2})$/);
    if (m) return m[1];
    return latestAvailableDate;
  }, [pathname, latestAvailableDate]);
  const isHistorical = selectedDate !== latestAvailableDate;

  // Fetch available dates once so selectedDate defaults to most recent brief when path is "/"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/briefs/available-dates", {
          signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.dates)) {
          setAvailableDates(data.dates);
          if (data.dates.length > 0) setLatestAvailableDate(data.dates[0]);
        }
      } catch {
        // keep latestAvailableDate as today
      } finally {
        if (!cancelled) setAvailableDatesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateToDate = useCallback(
    (date: string) => {
      if (date === today) router.push("/");
      else router.push(`/brief/${date}`);
    },
    [router, today]
  );

  const applyBrief = useCallback((nextBrief: BriefData, fromCache: boolean) => {
    setBrief(nextBrief);
    setError(null);
    setSummaryComplete(fromCache);
    setRestoredFromCache(fromCache);
    setSourcesRevealed(fromCache);
  }, []);

  const fetchBriefForDate = useCallback(
    async (date: string) => {
      const cached = briefCache.get(date);
      if (cached) {
        const repaired = repairBriefData(cached);
        briefCache.set(date, repaired);
        applyBrief(repaired, true);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setBrief(null);
      setSummaryComplete(false);
      setRestoredFromCache(false);
      setSourcesRevealed(false);

      const isToday = date === today;
      const url = isToday ? "/api/brief/today" : `/api/brief/${date}`;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load brief");
        const nextBrief = repairBriefData({
          title: data.title ?? null,
          summary: data.summary ?? "",
          paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [],
          sources: data.sources ?? [],
          generatedAt: data.generatedAt ?? null,
          date: data.date ?? null,
          isFallback: data.isFallback === true,
        });
        briefCache.set(date, nextBrief);
        applyBrief(nextBrief, false);
        if (date === latestAvailableDate) {
          try {
            sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(nextBrief));
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
    [today, latestAvailableDate, applyBrief]
  );

  useEffect(() => {
    if (!availableDatesLoaded) return;
    const stored = loadBriefFromStorage();
    if (
      stored?.date === latestAvailableDate &&
      stored?.summary != null &&
      stored.date === selectedDate
    ) {
      const repaired = repairBriefData(stored);
      briefCache.set(stored.date, repaired);
      applyBrief(repaired, true);
      try {
        sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(repaired));
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }
    fetchBriefForDate(selectedDate);
  }, [selectedDate, latestAvailableDate, pathname, availableDatesLoaded, fetchBriefForDate, applyBrief]);

  useEffect(() => {
    if (!summaryComplete || !brief?.sources.length) return;
    const count = Math.min(brief.sources.length, 5);
    const delay = 300 + count * 80;
    const t = setTimeout(() => setSourcesRevealed(true), delay);
    return () => clearTimeout(t);
  }, [summaryComplete, brief?.sources.length]);

  const handleSummaryComplete = useCallback(() => setSummaryComplete(true), []);

  const value: BriefContextValue = useMemo(
    () => ({
      brief,
      loading,
      error,
      summaryComplete,
      sourcesRevealed,
      restoredFromCache,
      handleSummaryComplete,
      setSummaryComplete,
      setSourcesRevealed,
      selectedDate,
      isHistorical,
      navigateToDate,
      availableDates,
      availableDatesLoading: !availableDatesLoaded,
    }),
    [
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
      availableDatesLoaded,
    ]
  );

  return (
    <BriefContext.Provider value={value}>{children}</BriefContext.Provider>
  );
}

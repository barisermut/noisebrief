"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "noisebrief-theme";
export type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const t = window.localStorage.getItem(STORAGE_KEY);
  if (t === "light" || t === "dark" || t === "system") return t;
  return "system";
}

function getResolvedDark(theme: Theme): boolean {
  if (theme === "light") return false;
  if (theme === "dark") return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  resolvedDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedDark, setResolvedDark] = useState(false);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      // Sync class immediately so UI updates before next paint (Tailwind only cares about .dark on html, not .light)
      const dark = getResolvedDark(next);
      const root = document.documentElement;
      if (dark) root.classList.add("dark");
      else root.classList.remove("dark");
      setResolvedDark(dark);
    }
  }, []);

  // On mount: read localStorage and apply to html
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    const dark = getResolvedDark(stored);
    setResolvedDark(dark);
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // When theme changes: sync html class (backup for any state-driven updates)
  useEffect(() => {
    const dark = getResolvedDark(theme);
    setResolvedDark(dark);
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // When theme is "system", listen to prefers-color-scheme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = () => {
      const dark = mq.matches;
      setResolvedDark(dark);
      const root = document.documentElement;
      if (dark) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolvedDark }),
    [theme, setTheme, resolvedDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

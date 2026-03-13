"use client";

import { useCallback, useState, useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { Theme } from "./ThemeProvider";
import { useTheme } from "./ThemeProvider";

const ORDER: Theme[] = ["system", "light", "dark"];
const TITLES: Record<Theme, string> = {
  system: "Switch to light mode",
  light: "Switch to dark mode",
  dark: "Use system theme",
};

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const cycle = useCallback(() => {
    const i = ORDER.indexOf(theme);
    const next = ORDER[(i + 1) % ORDER.length];
    setTheme(next);
  }, [theme, setTheme]);

  const title = TITLES[theme];
  // Server and first client paint: always Monitor to avoid hydration mismatch (theme from localStorage differs from server's "system").
  // After mount: show theme-based icon so saved dark/light shows correctly; flash is unavoidable when avoiding hydration error.
  const Icon = !mounted ? Monitor : theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      suppressHydrationWarning
      className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/6 dark:bg-white/6 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors text-[#6b6b6b] hover:text-foreground dark:text-zinc-500 dark:hover:text-white"
    >
      <Icon className="h-4 w-4 sm:h-[1em] sm:w-[1em] sm:text-sm" aria-hidden suppressHydrationWarning />
    </button>
  );
}

"use client";

import { useCallback } from "react";
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
  const { theme, setTheme } = useTheme();

  const cycle = useCallback(() => {
    const i = ORDER.indexOf(theme);
    const next = ORDER[(i + 1) % ORDER.length];
    setTheme(next);
  }, [theme, setTheme]);

  const title = TITLES[theme];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className="min-h-[44px] min-w-[44px] inline-flex cursor-pointer items-center justify-center text-[#6b6b6b] transition-colors hover:text-foreground dark:text-zinc-500 dark:hover:text-white"
    >
      <Icon className="h-4 w-4 sm:h-[1em] sm:w-[1em] sm:text-sm" aria-hidden />
    </button>
  );
}

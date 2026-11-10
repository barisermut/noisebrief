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
    setTheme(ORDER[(i + 1) % ORDER.length]);
  }, [theme, setTheme]);

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const title = TITLES[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className="inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

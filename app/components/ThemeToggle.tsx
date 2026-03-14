"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [icon, setIcon] = useState<"monitor" | "sun" | "moon">("monitor");

  useEffect(() => {
    if (theme === "light") setIcon("sun");
    else if (theme === "dark") setIcon("moon");
    else setIcon("monitor");
  }, [theme]);

  const cycle = useCallback(() => {
    const i = ORDER.indexOf(theme);
    setTheme(ORDER[(i + 1) % ORDER.length]);
  }, [theme, setTheme]);

  const Icon = icon === "sun" ? Sun : icon === "moon" ? Moon : Monitor;
  const title = TITLES[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      suppressHydrationWarning
      className="inline-flex items-center justify-center align-middle rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors text-foreground/50 hover:text-foreground dark:text-foreground/50 dark:hover:text-white"
    >
      <Icon className="h-4 w-4 sm:h-[1em] sm:w-[1em] sm:text-sm" aria-hidden suppressHydrationWarning />
    </button>
  );
}

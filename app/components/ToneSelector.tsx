"use client";

import type { Tone } from "@/types";

const TONES: { tone: Tone; label: string; emoji: string }[] = [
  { tone: "Quirky", label: "Quirky", emoji: "😄" },
  { tone: "Formal", label: "Formal", emoji: "👔" },
  { tone: "Cheesy", label: "Cheesy", emoji: "🧀" },
  { tone: "Savage", label: "Savage", emoji: "🔥" },
  { tone: "Inspirational", label: "Inspirational", emoji: "💡" },
  { tone: "TLDR", label: "TL;DR", emoji: "⚡" },
];

interface ToneSelectorProps {
  selected: Tone | null;
  onSelect: (tone: Tone) => void;
  loading: boolean;
}

export function ToneSelector({
  selected,
  onSelect,
  loading,
}: ToneSelectorProps) {
  return (
    <div className="flex flex-row gap-2 overflow-x-auto pb-3 sm:pb-0 -mx-4 px-4 sm:grid sm:grid-cols-6 sm:overflow-visible sm:mx-0 sm:px-0">
      {TONES.map(({ tone, label, emoji }) => {
        const isSelected = selected === tone;
        return (
          <button
            key={tone}
            type="button"
            onClick={() => !loading && onSelect(tone)}
            disabled={loading}
            className={`
              flex min-w-[80px] flex-col items-center gap-1.5 rounded-xl border px-4 py-3 transition-all duration-200
              ${isSelected
                ? "border-teal-500 bg-teal-500/10 dark:bg-teal-500/10 text-teal-700 dark:text-white"
                : "border-foreground/20 dark:border-white/20 bg-foreground/8 dark:bg-white/8 text-foreground/70 dark:text-white/70 hover:border-foreground/30 dark:hover:border-white/30 hover:text-foreground/90 dark:hover:text-white/90"
              }
              ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
            `}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

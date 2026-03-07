"use client";

import type { Tone } from "@/types";
import { motion } from "framer-motion";

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
    <div className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap">
      {TONES.map(({ tone, label, emoji }) => (
        <motion.button
          key={tone}
          type="button"
          layout={false}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ willChange: "transform" }}
          onClick={() => !loading && onSelect(tone)}
          disabled={loading}
          className={`flex min-h-[44px] min-w-0 shrink items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
            selected === tone
              ? "border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(0,212,170,0.15)]"
              : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          } ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <span className="mr-1.5 shrink-0">{emoji}</span>
          <span className="truncate">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

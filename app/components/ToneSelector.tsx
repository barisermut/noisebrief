"use client";

import type { Tone } from "@/types";

/* MAKE IT YOURS — disabled. Tone picker UI removed; restore from git history. */

interface ToneSelectorProps {
  selected: Tone | null;
  onSelect: (tone: Tone) => void;
  loading: boolean;
}

export function ToneSelector(_props: ToneSelectorProps) {
  return null;
}

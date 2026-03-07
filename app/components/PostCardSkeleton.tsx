"use client";

import { FileText } from "lucide-react";

export function PostCardSkeleton() {
  return (
    <div
      className="post-card-enter rounded-xl border border-white/10 border-l-4 border-l-teal-400 bg-[#13131a] p-4"
      style={{ willChange: "transform" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-teal-400" />
        <span className="text-xs text-zinc-500">Your recap — ready to copy & share anywhere</span>
      </div>
      <div className="space-y-3 rounded-lg border border-white/5 bg-black/20 p-4">
        <div className="post-card-skeleton-line h-3 w-full rounded bg-teal-400/20" />
        <div className="post-card-skeleton-line post-card-skeleton-line-2 h-3 w-[85%] rounded bg-teal-400/20" />
        <div className="post-card-skeleton-line post-card-skeleton-line-3 h-3 w-[60%] rounded bg-teal-400/20" />
      </div>
    </div>
  );
}

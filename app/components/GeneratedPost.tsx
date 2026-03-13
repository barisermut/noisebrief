"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, FileText } from "lucide-react";

interface GeneratedPostProps {
  post: string;
}

export function GeneratedPost({ post }: GeneratedPostProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(post);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Couldn't copy. Please try again.");
    }
  }, [post]);

  return (
    <div
      className="post-card-enter min-w-0 rounded-xl border border-zinc-200 border-l-4 border-l-teal-400 bg-white p-3 dark:border-white/10 dark:bg-[#13131a] sm:p-4"
      style={{ willChange: "transform", transition: "opacity 0.2s ease-out, transform 0.2s ease-out" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-teal-400" />
        <span className="text-xs text-[#6b6b6b] dark:text-zinc-500">
          Your recap — ready to copy &amp; share anywhere
        </span>
      </div>
      <div className="mb-4 min-w-0 overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-[#1a1a1a] dark:border-white/5 dark:bg-black/20 dark:text-zinc-300 sm:p-4">
        {post}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-[44px] w-auto cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-500 dark:bg-teal-500 px-4 py-2 text-sm font-medium text-white dark:text-[#0a0a0f] transition-colors hover:opacity-90"
      >
        {!copied && <Copy className="h-4 w-4 shrink-0" />}
        {copied ? "Copied ✓" : "Copy & Share"}
      </button>
      {copyError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{copyError}</p>}
    </div>
  );
}

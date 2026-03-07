"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, FileText } from "lucide-react";
import { motion } from "framer-motion";

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

  const handleCopy = async () => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(post);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Couldn’t copy. Please try again.");
    }
  };

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ willChange: "transform" }}
      className="min-w-0 rounded-xl border border-white/10 border-l-4 border-l-teal-400 bg-[#13131a] p-3 sm:p-4"
    >
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-teal-400" />
        <span className="min-w-0 truncate text-xs text-zinc-500">Your recap — ready to copy & share anywhere</span>
      </div>
      <div className="mb-4 min-w-0 overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-white/5 bg-black/20 p-3 text-sm leading-relaxed text-zinc-300 sm:p-4">
        {post}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30 sm:w-auto sm:inline-flex"
      >
        {!copied && <Copy className="h-4 w-4 shrink-0" />}
        {copied ? "Copied ✓" : "Copy & Share"}
      </button>
      {/* <ShareLinkedIn /> — re-enable in V2 */}
      {copyError && <p className="mt-2 text-xs text-red-400">{copyError}</p>}
    </motion.div>
  );
}

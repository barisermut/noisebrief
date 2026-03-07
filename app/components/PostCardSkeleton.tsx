"use client";

import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export function PostCardSkeleton() {
  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ willChange: "transform" }}
      className="rounded-xl border border-white/10 border-l-4 border-l-teal-400 bg-[#13131a] p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-teal-400" />
        <span className="text-xs text-zinc-500">Your recap — ready to copy & share anywhere</span>
      </div>
      <div className="space-y-3 rounded-lg border border-white/5 bg-black/20 p-4">
        <motion.div
          layout={false}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ willChange: "transform" }}
          className="h-3 w-full rounded bg-teal-400/20"
        />
        <motion.div
          layout={false}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
          style={{ willChange: "transform" }}
          className="h-3 w-[85%] rounded bg-teal-400/20"
        />
        <motion.div
          layout={false}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          style={{ willChange: "transform" }}
          className="h-3 w-[60%] rounded bg-teal-400/20"
        />
      </div>
    </motion.div>
  );
}

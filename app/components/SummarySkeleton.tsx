"use client";

import { motion } from "framer-motion";

export function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ willChange: "transform" }}
        className="h-4 w-full rounded bg-zinc-700/50"
      />
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        style={{ willChange: "transform" }}
        className="h-4 w-full rounded bg-zinc-700/50"
      />
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        style={{ willChange: "transform" }}
        className="h-4 w-[85%] rounded bg-zinc-700/50"
      />
      <div className="pt-2" />
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        style={{ willChange: "transform" }}
        className="h-4 w-full rounded bg-zinc-700/50"
      />
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        style={{ willChange: "transform" }}
        className="h-4 w-full rounded bg-zinc-700/50"
      />
      <motion.div
        layout={false}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        style={{ willChange: "transform" }}
        className="h-4 w-[70%] rounded bg-zinc-700/50"
      />
    </div>
  );
}

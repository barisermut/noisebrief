"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { BriefParagraph } from "@/types/brief";
import { ParagraphWithKeyword } from "./ParagraphWithKeyword";

interface AnimatedParagraphsProps {
  paragraphs: BriefParagraph[];
  animate?: boolean;
  onComplete?: () => void;
}

export function AnimatedParagraphs({
  paragraphs,
  animate = true,
  onComplete,
}: AnimatedParagraphsProps) {
  const lastDelay = animate ? (paragraphs.length - 1) * 0.15 + 0.4 : 0;

  useEffect(() => {
    if (!animate || paragraphs.length === 0 || !onComplete) return;
    const t = setTimeout(onComplete, lastDelay * 1000);
    return () => clearTimeout(t);
  }, [animate, paragraphs.length, onComplete, lastDelay]);

  return (
    <div className="space-y-6">
      {paragraphs.map((p, i) => (
        <motion.p
          key={i}
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: animate ? i * 0.15 : 0,
          }}
          className="text-base leading-relaxed text-[#1a1a1a] dark:text-white/80 sm:text-lg sm:leading-relaxed"
        >
          <ParagraphWithKeyword paragraph={p} />
        </motion.p>
      ))}
    </div>
  );
}

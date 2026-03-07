"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface TypewriterSummaryProps {
  text: string;
  className?: string;
  onComplete?: () => void;
  charDelay?: number;
  skipToEnd?: boolean;
  skipRef?: React.RefObject<boolean>;
}

export function TypewriterSummary({
  text,
  className = "",
  onComplete,
  charDelay = 12,
  skipToEnd = false,
  skipRef,
}: TypewriterSummaryProps) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);
  const [completedFired, setCompletedFired] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setDisplayed("");
    setIndex(0);
    setCompletedFired(false);
  }, [text]);

  useEffect(() => {
    if ((skipToEnd || skipRef?.current === true) && text.length > 0 && !completedFired) {
      setIndex(text.length);
      setDisplayed(text);
      setCompletedFired(true);
      onComplete?.();
    }
  }, [skipToEnd, text, onComplete, completedFired, skipRef]);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      if (skipRef?.current === true || skipToEnd) {
        cancelAnimationFrame(rafId);
        setIndex(text.length);
        setDisplayed(text);
        if (text.length > 0 && onComplete && !completedFired) {
          setCompletedFired(true);
          onComplete();
        }
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const targetIndex = Math.min(
        Math.floor(elapsed / charDelay),
        text.length
      );

      if (targetIndex > index) {
        setIndex(targetIndex);
        setDisplayed(text.slice(0, targetIndex));
      }

      if (targetIndex >= text.length && text.length > 0) {
        cancelAnimationFrame(rafId);
        if (onComplete && !completedFired) {
          setCompletedFired(true);
          onComplete();
        }
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [text, index, charDelay, onComplete, completedFired, skipToEnd, skipRef]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - startTimeRef.current;
        const targetIndex = Math.min(
          Math.floor(elapsed / charDelay),
          text.length
        );
        setIndex(targetIndex);
        setDisplayed(text.slice(0, targetIndex));
        if (targetIndex >= text.length && text.length > 0 && onComplete && !completedFired) {
          setCompletedFired(true);
          onComplete();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [text, charDelay, onComplete, completedFired]);

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      viewport={{ once: true }}
      style={{ willChange: "transform" }}
      className={className}
    >
      {skipToEnd || skipRef?.current === true ? text : displayed}
      {!skipToEnd && skipRef?.current !== true && index < text.length && (
        <motion.span
          layout={false}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ willChange: "transform" }}
        >
          |
        </motion.span>
      )}
    </motion.div>
  );
}

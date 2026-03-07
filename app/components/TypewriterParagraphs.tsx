"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface TypewriterParagraphsProps {
  paragraphs: string[];
  className?: string;
  charDelay?: number;
  paragraphDelay?: number;
  onComplete?: () => void;
  skipToEnd?: boolean;
  skipRef?: React.RefObject<boolean>;
}

export function TypewriterParagraphs({
  paragraphs,
  className = "",
  charDelay = 12,
  paragraphDelay = 400,
  onComplete,
  skipToEnd = false,
  skipRef,
}: TypewriterParagraphsProps) {
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [completedFired, setCompletedFired] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setParagraphIndex(0);
    setCharIndex(0);
    setDisplayed("");
    setCompletedFired(false);
  }, [paragraphs.length]);

  useEffect(() => {
    if ((skipToEnd || skipRef?.current === true) && paragraphs.length > 0 && !completedFired) {
      setParagraphIndex(paragraphs.length);
      setCharIndex(0);
      setDisplayed("");
      setCompletedFired(true);
      onComplete?.();
    }
  }, [skipToEnd, paragraphs, onComplete, completedFired, skipRef]);

  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const totalDuration =
    totalChars * charDelay + (paragraphs.length - 1) * paragraphDelay;

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      if (skipRef?.current === true || skipToEnd) {
        cancelAnimationFrame(rafId);
        if (paragraphs.length > 0 && onComplete && !completedFired) {
          setCompletedFired(true);
          onComplete();
        }
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= totalDuration && paragraphs.length > 0) {
        cancelAnimationFrame(rafId);
        setParagraphIndex(paragraphs.length - 1);
        setCharIndex(paragraphs[paragraphs.length - 1]?.length ?? 0);
        setDisplayed(paragraphs[paragraphs.length - 1] ?? "");
        if (onComplete && !completedFired) {
          setCompletedFired(true);
          onComplete();
        }
        return;
      }

      let acc = 0;
      let pIdx = 0;
      let cIdx = 0;

      for (let i = 0; i < paragraphs.length; i++) {
        const pLen = paragraphs[i]?.length ?? 0;
        const segmentDuration = pLen * charDelay;
        if (elapsed <= acc + segmentDuration) {
          pIdx = i;
          cIdx = Math.min(
            Math.floor((elapsed - acc) / charDelay),
            pLen
          );
          break;
        }
        acc += segmentDuration + paragraphDelay;
        if (elapsed <= acc) {
          pIdx = i + 1;
          cIdx = 0;
          break;
        }
      }

      setParagraphIndex(pIdx);
      setCharIndex(cIdx);
      const current = paragraphs[pIdx] ?? "";
      setDisplayed(current.slice(0, cIdx));

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    paragraphs,
    charDelay,
    paragraphDelay,
    totalDuration,
    onComplete,
    completedFired,
    skipToEnd,
    skipRef,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - startTimeRef.current;

        if (elapsed >= totalDuration && paragraphs.length > 0) {
          setParagraphIndex(paragraphs.length - 1);
          setCharIndex(paragraphs[paragraphs.length - 1]?.length ?? 0);
          setDisplayed(paragraphs[paragraphs.length - 1] ?? "");
          if (onComplete && !completedFired) {
            setCompletedFired(true);
            onComplete();
          }
          return;
        }

        let acc = 0;
        let pIdx = 0;
        let cIdx = 0;

        for (let i = 0; i < paragraphs.length; i++) {
          const pLen = paragraphs[i]?.length ?? 0;
          const segmentDuration = pLen * charDelay;
          if (elapsed <= acc + segmentDuration) {
            pIdx = i;
            cIdx = Math.min(
              Math.floor((elapsed - acc) / charDelay),
              pLen
            );
            break;
          }
          acc += segmentDuration + paragraphDelay;
          if (elapsed <= acc) {
            pIdx = i + 1;
            cIdx = 0;
            break;
          }
        }

        setParagraphIndex(pIdx);
        setCharIndex(cIdx);
        const current = paragraphs[pIdx] ?? "";
        setDisplayed(current.slice(0, cIdx));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [paragraphs, totalDuration, charDelay, paragraphDelay, onComplete, completedFired]);

  if (paragraphs.length === 0) return null;

  if (skipToEnd || skipRef?.current === true) {
    return (
      <div className={className}>
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4 last:mb-0">
            {p}
          </p>
        ))}
      </div>
    );
  }

  const currentParagraph = paragraphs[paragraphIndex] ?? "";
  const isCurrentDone = charIndex >= currentParagraph.length;
  const allDone =
    paragraphIndex >= paragraphs.length - 1 && isCurrentDone;

  return (
    <div className={className}>
      {paragraphs.slice(0, paragraphIndex).map((p, i) => (
        <p key={i} className="mb-4 last:mb-0">
          {p}
        </p>
      ))}
      {paragraphIndex < paragraphs.length && (
        <p className="mb-4 last:mb-0">
          {displayed}
          {!allDone && (
            <motion.span
              layout={false}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ willChange: "transform" }}
            >
              |
            </motion.span>
          )}
        </p>
      )}
    </div>
  );
}

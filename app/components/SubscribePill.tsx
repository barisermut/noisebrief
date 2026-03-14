"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

type State = "idle" | "expanded" | "loading" | "success" | "error";

export function SubscribePill({ className, onExpandedChange }: { className?: string; onExpandedChange?: (expanded: boolean) => void }) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const pillRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    onExpandedChange?.(state === "expanded" || state === "loading");
  }, [state, onExpandedChange]);

  // Click outside → collapse to idle
  useEffect(() => {
    if (state !== "expanded" && state !== "loading") return;
    const handler = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setState("idle");
        setEmail("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state]);

  // Auto-focus input when expanded — shorter delay on mobile so keyboard opens without re-tap
  useEffect(() => {
    if (state === "expanded") {
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
      const delay = isMobile ? 50 : 300;
      const t = setTimeout(() => inputRef.current?.focus(), delay);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Error auto-reset
  useEffect(() => {
    if (state !== "error") return;
    const t = setTimeout(() => setState("expanded"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  const submit = useCallback(async () => {
    if (!isValidEmail || state !== "expanded") return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setState("success");
      } else {
        setErrorMsg("Try again");
        setState("error");
      }
    } catch {
      setErrorMsg("Try again");
      setState("error");
    }
  }, [email, isValidEmail, state]);

  const borderColor =
    state === "expanded" || state === "loading"
      ? "border-teal-500 dark:border-teal-400"
      : state === "success"
      ? "border-teal-500 dark:border-teal-400"
      : state === "error"
      ? "border-red-400"
      : "border-black/15 dark:border-white/15";

  const isExpandedOrLoading = state === "expanded" || state === "loading";
  const widthClass = isExpandedOrLoading ? "w-full max-w-[65vw] sm:max-w-[360px]" : "w-auto";

  return (
    <motion.div
      ref={pillRef}
      layout
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex items-center h-9 rounded-full border bg-background overflow-hidden ${widthClass} ${borderColor} ${className ?? ""}`}
      style={{ originX: 1 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "idle" && (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => {
              flushSync(() => setState("expanded"));
              inputRef.current?.focus();
            }}
            className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-sm text-foreground/60 whitespace-nowrap cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Subscribe
          </motion.button>
        )}

        {(state === "expanded" || state === "loading") && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center w-full px-3 gap-2"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="your@email.com"
              disabled={state === "loading"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/30 min-w-0"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!isValidEmail || state === "loading"}
              className="shrink-0 h-6 w-6 rounded-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-opacity"
            >
              {state === "loading"
                ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                : <ArrowRight className="h-3.5 w-3.5 text-white" />}
            </button>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-3 text-sm text-foreground/60 whitespace-nowrap"
          >
            <CheckCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />
            You&apos;re in!
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-3 text-sm text-red-400 whitespace-nowrap"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

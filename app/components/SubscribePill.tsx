"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

type State = "idle" | "expanded" | "loading" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribePill({ onExpandedChange }: { onExpandedChange?: (expanded: boolean) => void }) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const pillRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = EMAIL_REGEX.test(email);
  const showInput = state === "expanded" || state === "loading";

  useEffect(() => {
    onExpandedChange?.(showInput);
  }, [showInput, onExpandedChange]);

  const idleButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  const collapse = useCallback(() => {
    setState("idle");
    setEmail("");
  }, []);

  // After closing with Escape, keyboard focus returns to the Subscribe button.
  useEffect(() => {
    if (state === "idle" && restoreFocus.current) {
      restoreFocus.current = false;
      idleButtonRef.current?.focus();
    }
  }, [state]);

  // Click outside → collapse.
  useEffect(() => {
    if (state !== "expanded") return;
    const handler = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) collapse();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state, collapse]);

  // Error message auto-resets back to the form.
  useEffect(() => {
    if (state !== "error") return;
    const t = setTimeout(() => setState("expanded"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  const expand = useCallback(() => {
    setState("expanded");
    // Focus synchronously inside the tap handler so iOS opens the keyboard.
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidEmail || state !== "expanded") return;
      setState("loading");
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setState(res.ok ? "success" : "error");
      } catch {
        setState("error");
      }
    },
    [email, isValidEmail, state]
  );

  const border =
    state === "error" ? "border-destructive" : state === "idle" ? "border-input hover:border-foreground/30" : "border-ring";

  return (
    <form
      ref={pillRef}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape" && state === "expanded") {
          restoreFocus.current = true;
          collapse();
        }
      }}
      className={`relative flex h-11 items-center overflow-hidden rounded-full border bg-background transition-[border-color,max-width] duration-300 ${border} ${showInput ? "w-full max-w-[65vw] sm:max-w-[360px]" : "w-auto"}`}
      noValidate
    >
      {/* Kept in the DOM (hidden + untabbable) so the tap handler can focus it synchronously: iOS needs that to open the keyboard. */}
      <div
        aria-hidden={!showInput}
        className={`flex w-full items-center gap-2 pl-3 pr-1 ${showInput ? "" : "pointer-events-none absolute h-0 w-0 opacity-0"}`}
      >
        <Mail aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="email"
          aria-label="Email address"
          tabIndex={showInput ? 0 : -1}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            if (email.trim() === "" && state === "expanded") setTimeout(() => setState("idle"), 150);
          }}
          placeholder="your@email.com"
          disabled={state === "loading"}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          tabIndex={showInput ? 0 : -1}
          disabled={!isValidEmail || state === "loading"}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "loading" ? (
            <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <ArrowRight aria-hidden className="h-4 w-4" />
          )}
        </button>
      </div>

      {state === "idle" && (
        <button
          ref={idleButtonRef}
          type="button"
          onTouchEnd={(e) => {
            e.preventDefault();
            expand();
          }}
          onClick={expand}
          className="flex h-full w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium text-foreground motion-safe:animate-in motion-safe:fade-in-0"
        >
          <Mail aria-hidden className="h-4 w-4 shrink-0" />
          Subscribe
        </button>
      )}

      <p role="status" className={state === "success" || state === "error" ? "flex items-center gap-1.5 whitespace-nowrap px-4 text-sm motion-safe:animate-in motion-safe:fade-in-0" : "sr-only"}>
        {state === "success" && (
          <>
            <CheckCircle aria-hidden className="h-4 w-4 shrink-0 text-link" />
            <span className="text-foreground">Check your inbox</span>
          </>
        )}
        {state === "error" && <span className="text-destructive">Something went wrong. Try again</span>}
      </p>
    </form>
  );
}

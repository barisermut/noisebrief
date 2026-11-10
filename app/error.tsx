"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("App error boundary:", error);
    }
  }, [error]);

  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1
        className="font-heading text-3xl font-bold text-foreground"
      >
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}

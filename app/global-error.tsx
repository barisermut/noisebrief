"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white font-sans antialiased flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-white/70 max-w-md">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 cursor-pointer rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-[#0a0a0f] hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}

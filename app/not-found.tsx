import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found | Noisebrief", robots: { index: false } };

export default function NotFoundPage() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1
        className="font-heading text-4xl font-bold text-foreground"
      >
        404
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        This page doesn&apos;t exist. Maybe the brief hasn&apos;t dropped yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to Noisebrief
      </Link>
    </main>
  );
}

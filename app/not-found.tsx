import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-6 text-center">
      <h1
        className="text-4xl font-bold text-white"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        404
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        This page doesn&apos;t exist. Maybe the brief hasn&apos;t dropped yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex cursor-pointer items-center rounded-lg bg-primary/20 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
      >
        Back to Noisebrief
      </Link>
    </main>
  );
}

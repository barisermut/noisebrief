import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-teal-400 transition-colors hover:text-teal-300"
        >
          ← Back to Noisebrief
        </Link>

        <h1
          className="font-heading text-2xl font-bold text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Last updated: March 2026</p>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            What we collect
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Nothing. Noisebrief does not collect personal information, require
            account creation, or store any user data.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Server logs
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Our hosting provider (Vercel) automatically records standard server
            logs including IP addresses and browser types. We do not access or
            use this data to identify users.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Cookies
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Noisebrief does not use cookies or any tracking technologies.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Third-party services
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Noisebrief uses the following services to operate:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-zinc-400">
            <li>Vercel — hosting</li>
            <li>Supabase — database</li>
            <li>Anthropic — AI summaries</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Each has their own privacy policy governing data they collect.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Content
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Noisebrief aggregates publicly available content from RSS feeds
            including Hacker News, TechCrunch, The Verge, Wired, and Reddit. All
            content links back to the original source.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Questions? Reach out via{" "}
            <a
              href="https://barisermut.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              barisermut.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Noisebrief",
  description:
    "Noisebrief privacy policy. We don't collect personal data, use cookies, or track users.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-full bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-teal-500 transition-colors hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Back to Noisebrief
        </Link>

        <h1
          className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: March 2026</p>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            What we collect
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief collects your email address if you choose to subscribe to
            the daily digest. This is the only personal information we collect.
            We do not require account creation or store any other user data.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your email is used solely to send you the daily brief. We will never
            sell, share, or use it for any other purpose. You can unsubscribe at
            any time using the link in any email we send you.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We use IP addresses for rate limiting (e.g. subscribe, unsubscribe)
            to prevent abuse. We do not use them to identify or profile you.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Server logs
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Our hosting provider (Vercel) automatically records standard server
            logs including IP addresses and browser types. We also keep
            operational and error logs (e.g. masked email in send-failure
            messages) only to fix technical issues.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Cookies
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief does not use cookies or any tracking technologies.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Third-party services
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief uses the following services to operate:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
            <li>Vercel — hosting</li>
            <li>Supabase — database (stores subscriber email addresses)</li>
            <li>Anthropic — AI summaries</li>
            <li>Resend — email delivery</li>
            <li>Upstash — rate limiting</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Each has their own privacy policy governing data they collect.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Content
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief aggregates publicly available content from RSS feeds
            including Hacker News, TechCrunch, The Verge, Wired, and Reddit. All
            content links back to the original source.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Questions? Reach out via{" "}
            <a
              href="https://barisermut.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
            >
              barisermut.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

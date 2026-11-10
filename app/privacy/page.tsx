import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Noisebrief",
  alternates: { canonical: "/privacy" },
  description:
    "Noisebrief privacy policy: we only store your email if you subscribe, use no cookies, and never sell your data.",
};

export default function PrivacyPage() {
  return (
    <main id="main" className="min-h-full bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center text-sm text-link underline-offset-2 hover:text-link-hover hover:underline"
        >
          ← Back to Noisebrief
        </Link>

        <h1
          className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
        >
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: November 2026</p>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            >
            What we collect
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief collects your email address if you choose to subscribe to
            the daily digest. This is the only personal information we collect.
            We do not require account creation or store any other user data.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When you subscribe we send one confirmation email; nothing else is
            sent until you click its link. Your email is used solely to send you
            the daily brief. We will never
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
            >
            Cookies
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief does not use cookies. We use Vercel Web Analytics and
            Speed Insights, which count page views and measure page speed in
            aggregate without cookies and without identifying you. Your theme
            choice is stored only in your own browser.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
            >
            Third-party services
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Noisebrief uses the following services to operate:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
            <li>Hosting and privacy-friendly analytics: Vercel</li>
            <li>Database: Supabase (stores subscriber email addresses)</li>
            <li>AI summaries: Anthropic</li>
            <li>Email delivery: Resend</li>
            <li>Rate limiting: Upstash</li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Each has their own privacy policy governing data they collect.
          </p>
        </section>

        <section className="mt-8">
          <h2
            className="font-heading text-lg font-semibold text-foreground"
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
            >
            Contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Questions? Reach out via{" "}
            <a
              href="https://barisermut.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline underline-offset-2 hover:text-link-hover"
            >
              barisermut.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

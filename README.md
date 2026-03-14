# noisebrief.

Today's tech noise. Briefly.

[noisebrief.com](https://noisebrief.com) — a daily one-pager that answers "what happened today in tech?" It pulls from Hacker News, TechCrunch, The Verge, Wired, and Reddit; summarizes everything with AI into two punchy paragraphs; and lets you generate shareable recaps in six tones or get the whole thing by email every morning. No feeds to manage. Just open it, get briefed, move on.

---

## What it does

- Fetches RSS from Hacker News, TechCrunch, The Verge, Wired, and key Reddit subs — once per day via cron.
- Summarizes the lot with Claude into a title and 2–3 paragraphs, deduped against yesterday.
- Lets you rewrite the brief in six tones (Quirky, Formal, Cheesy, Savage, Inspirational, TL;DR) and copy or share.
- Sends a daily email digest at 8:30 AM UTC to subscribers, with a welcome email on first signup.

---

## Stack

| Technology      | Purpose                                      |
|-----------------|----------------------------------------------|
| Next.js 16      | App Router, API routes, cron, OG image       |
| TypeScript      | Strict typing across app and API             |
| Tailwind CSS v4 | Styling; Syne font, dark/light theme         |
| Supabase        | Postgres for briefs, subscribers, cache      |
| Anthropic Claude API | Daily summary (Sonnet), tone posts (Haiku) |
| Resend          | Welcome and digest emails                    |
| Vercel          | Hosting and cron (daily 8AM, digest 8:30AM)  |
| Upstash Redis   | Rate limiting (subscribe, post, favicon)      |

---

## How it works

A Vercel cron job runs at 8 AM UTC: it fetches all RSS sources in parallel, dedupes against yesterday’s brief, sends the batch to Claude for one summary call, and stores the result in Supabase. The site serves today’s (or latest) brief via API; users can browse by date, generate tone variants (cached in DB), and subscribe for the daily digest. The digest cron runs at 8:30 AM UTC and emails all active subscribers using the same brief; new subscribers get a welcome email immediately.

---

## Running locally

1. Clone the repo.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in every value.
4. Run `npm run dev` and open http://localhost:3000.

---

## Environment variables

| Variable                     | What it's for                          | Where to get it                |
|-----------------------------|----------------------------------------|--------------------------------|
| NEXT_PUBLIC_SUPABASE_URL    | Supabase project URL                   | Supabase dashboard             |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon (public) key          | Supabase dashboard             |
| SUPABASE_SERVICE_ROLE_KEY   | Supabase service role (server-only)   | Supabase dashboard             |
| ANTHROPIC_API_KEY           | Claude API (summary + tone generation) | Anthropic console               |
| CRON_SECRET                 | Auth for cron endpoints                | You choose; set in Vercel      |
| RESEND_API_KEY              | Sending welcome and digest emails      | resend.com                     |
| UPSTASH_REDIS_REST_URL      | Redis for rate limiting                | upstash.com/redis              |
| UPSTASH_REDIS_REST_TOKEN    | Redis REST token                       | upstash.com/redis              |
| NEXT_PUBLIC_SITE_URL        | Base URL (metadata, sitemap, OG)      | e.g. https://noisebrief.com    |

---

## Built by

Built by [Barış Ermut](https://barisermut.com) — Senior PM learning to ship things with AI.

---

## License

MIT

<img src="public/logo.png" alt="" width="40" height="40">

# noisebrief.

Today's tech noise. Briefly.

[noisebrief.com](https://noisebrief.com) | a daily one-pager that answers "what happened today in tech?" It pulls from Hacker News, TechCrunch, The Verge, Wired, and Reddit; summarizes everything with AI into two punchy paragraphs; you can get the daily digest by email every morning. No feeds to manage. Just open it, get briefed, move on.

---

## What it does

- Fetches RSS from Hacker News, TechCrunch, The Verge, Wired, and key Reddit subs; once per day via cron.
- Summarizes the lot with Claude into a title and 2–3 paragraphs, deduped against yesterday.
- Sends a daily email digest to confirmed subscribers right after the 8 AM UTC cron job. Signup is double opt-in: a confirmation email first, then a welcome email.

---

## Stack

| Technology      | Purpose                                      |
|-----------------|----------------------------------------------|
| Next.js 16      | App Router, API routes, cron, OG image       |
| TypeScript      | Strict typing across app and API             |
| Tailwind CSS v4 | Styling; design tokens in `app/globals.css`, Syne via next/font, dark/light theme |
| Supabase        | Postgres for briefs, subscribers, cache      |
| Anthropic Claude API | Daily summary (Haiku 5.5, structured outputs) |
| Resend          | Welcome and digest emails                    |
| Vercel          | Hosting and cron (daily 8AM UTC)             |
| Upstash Redis   | Rate limiting (subscribe, confirm, unsubscribe) |

---

## How it works

A Vercel cron job runs at 8 AM UTC: it fetches all RSS sources in parallel, dedupes against yesterday’s brief, sends the batch to Claude for one summary call, and stores the result in Supabase. The site serves today’s (or latest) brief via API; users can browse by date and subscribe for the daily digest. The cron then revalidates the cached pages and sends the digest email to all confirmed subscribers. New subscribers confirm via email first, then get a welcome email.

---

## Running locally

1. Clone the repo.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in every value.
4. Run `npm run dev` and open http://localhost:3000.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in the required values.

See [`.env.example`](.env.example) for all variables with descriptions of what each one is for and where to get the credentials.

---

## Built by

Built by [Barış Ermut](https://barisermut.com) | Senior PM learning to ship things with AI.

---

## License

MIT

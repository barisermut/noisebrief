# Noisebrief

> Today's tech noise. Briefly.

Noisebrief is a daily tech intelligence briefing that cuts through the noise.
Every day, it pulls the most relevant stories and drama from across the web,
distills them into a sharp AI-generated summary, and lets you turn it into
a ready-to-share recap — in whatever tone fits your mood.

No feeds to manage. No subscriptions to read. Just open it, get briefed,
and share anywhere.

Live at: https://noisebrief.vercel.app

---

## What it does

- Pulls daily tech news and drama from Hacker News, TechCrunch, The Verge,
  Wired, and Reddit (via RSS) — once per day via cron job
- Uses Claude AI to summarize everything into a punchy title +
  2-3 sharp paragraphs
- Lets users generate a ready-to-share recap in 6 tones:
  Quirky, Formal, Cheesy, Savage, Inspirational, TL;DR
- Copy to clipboard and share anywhere

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude API (Sonnet for summaries, Haiku for recaps) |
| RSS Parsing | rss-parser |
| Hosting | Vercel |
| Cron | Vercel Cron Jobs (daily at 8AM UTC) |

## Content Sources

- Hacker News
- TechCrunch
- The Verge
- Wired
- Reddit (r/technology, r/artificial, r/singularity, r/tech,
  r/MachineLearning, r/ProductManagement)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CRON_SECRET=
```

## Running Locally

```bash
npm install
npm run dev
```

Trigger the daily cron manually:
```bash
curl -X GET http://localhost:3000/api/cron/daily \
  -H "authorization: Bearer YOUR_CRON_SECRET"
```

### Scripts

- **Favicons** — Regenerate PNG favicons from the source SVG (e.g. after changing `public/favicon.svg`):
  ```bash
  node scripts/generate-favicons.js
  ```
  Produces `public/favicon-32x32.png` and `public/apple-touch-icon.png` (requires `sharp` in devDependencies).

## About

Just another side project by an eager PM learning to build with Cursor.
Built by [Barış Ermut](https://barisermut.com).

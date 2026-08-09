# AGENTS.md

## Cursor Cloud specific instructions

This is **noisebrief**, a single Next.js 16 app (App Router, TypeScript, npm). Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`, `test`) and `README.md`; only non-obvious cloud setup notes are captured here.

### Services

| Service | Required? | How to run | Notes |
|---|---|---|---|
| Next.js dev server | Yes | `npm run dev` (port 3000) | The app itself. |
| Local Supabase (Postgres + PostgREST) | Yes to view/serve any data | `supabase start` (see runbook) | The app has no data source without it; every brief/subscribe API route calls Supabase. |
| Anthropic Claude | Only for the daily-generation cron (`/api/cron/daily`) | set `ANTHROPIC_API_KEY` | Not needed to view briefs or subscribe. |
| Resend (email) | No for local | set `RESEND_API_KEY` | Subscribe/cron swallow email failures, so signup works without it. |
| Upstash Redis | No | set `UPSTASH_REDIS_REST_*` | Rate limiting only; code logs "Rate limiting disabled" and no-ops when unset. |

The VM snapshot already has Docker + the Supabase CLI installed and Supabase images pulled. The `~/noisebrief-supabase` scratch dir (holding `supabase/config.toml`) and the Postgres data volume also persist, so restarts are fast.

### Local Supabase runbook

Docker has no systemd here, and `.env.local` is gitignored (so it is NOT restored from git). After a fresh VM boot:

1. Start the Docker daemon if not running: `sudo dockerd &` (config at `/etc/docker/daemon.json` uses `fuse-overlayfs` + `containerd-snapshotter: false`, required for Docker-in-Docker on this kernel).
2. Start Supabase: `cd ~/noisebrief-supabase && supabase start` (add `-x studio,imgproxy,edge-runtime,realtime,storage-api,inbucket,vector` to skip unused services). API is `http://127.0.0.1:54321`, DB is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Local anon/service_role keys are deterministic — copy them from `supabase status`.
3. If `daily_briefs`/`email_subscribers` tables are missing (fresh volume), apply schema, then reload PostgREST:
   - `docker exec -i supabase_db_noisebrief-supabase psql -U postgres -d postgres < /workspace/docs/schema.sql`
   - `docker exec -i supabase_db_noisebrief-supabase psql -U postgres -d postgres < /workspace/supabase/migrations/set_generated_post_if_missing.sql`
   - **Gotcha:** PostgREST caches the schema — after any DDL run `NOTIFY pgrst, 'reload schema';` or new tables return `PGRST205 (table not found)`.
4. Recreate `/workspace/.env.local` if missing: set `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from `supabase status`), and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Leave Anthropic/Resend/Upstash blank for the read + subscribe flows.
5. Seed a brief for today so the homepage renders content: insert one row into `daily_briefs` (columns `date, title, summary, paragraphs jsonb, sources jsonb`). The homepage `/api/brief/today` falls back to the latest brief if none exists for today.

Verify end-to-end: `curl localhost:3000/api/brief/today` (returns the brief) and `curl -X POST localhost:3000/api/subscribe -H 'Content-Type: application/json' -d '{"email":"x@example.com"}'` (returns `{"message":"subscribed"}` and inserts an `email_subscribers` row).

### Lint / test / build

- `npm test` (Vitest) and `npx tsc --noEmit` both pass and are what CI runs (`.github/workflows/ci.yml`, Node 22). CI does NOT run lint or build.
- `npm run lint` is currently **broken** regardless of the app code: ESLint 10 + the `eslint-plugin-react` bundled by `eslint-config-next` crash loading the `react/display-name` rule (`contextOrFilename.getFilename is not a function`). This is a pre-existing dependency incompatibility, not a code issue.
- `npm run build` works with `.env.local` present.

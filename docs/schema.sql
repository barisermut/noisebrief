-- Run this in your Supabase SQL editor to create the daily_briefs table.

create table if not exists daily_briefs (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  title text,
  summary text not null,
  paragraphs jsonb,
  sources jsonb not null,
  generated_posts jsonb,
  created_at timestamp with time zone default now()
);

-- For existing tables, add new columns if missing
alter table public.daily_briefs add column if not exists title text;
alter table public.daily_briefs add column if not exists paragraphs jsonb;
alter table public.daily_briefs add column if not exists generated_posts jsonb;

-- Optional: RLS (allow public read, restrict write to service role)
alter table daily_briefs enable row level security;

create policy "Allow public read"
  on daily_briefs for select
  using (true);

create policy "Service role only insert/update"
  on daily_briefs for all
  using (auth.role() = 'service_role');

-- email_subscribers table — stores digest subscribers.

create table if not exists email_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  subscribed_at timestamp with time zone default now(),
  unsubscribe_token text not null unique,
  unsubscribed_at timestamp with time zone
);

alter table email_subscribers enable row level security;

create policy "Service role only"
  on email_subscribers for all
  using (auth.role() = 'service_role');

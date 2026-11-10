-- Run once in the Supabase SQL editor BEFORE deploying the matching app version.
-- Safe to run more than once.

-- 1. Double opt-in: subscribers must confirm before they receive the digest.
--    Existing subscribers are grandfathered in as confirmed (only on the first run).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'email_subscribers' and column_name = 'confirmed_at'
  ) then
    alter table public.email_subscribers add column confirmed_at timestamp with time zone;
    update public.email_subscribers set confirmed_at = coalesce(subscribed_at, now());
  end if;
end $$;

-- 2. Remove the leftover SECURITY DEFINER function from the disabled "Make it yours"
--    feature. It was callable by anyone holding the public anon key and could write
--    into daily_briefs.
drop function if exists public.set_generated_post_if_missing(date, text, text);

-- 3. Optional: drop the unused column that stored the disabled feature's posts.
--    This deletes that data permanently; uncomment only if you don't need it.
-- alter table public.daily_briefs drop column if exists generated_posts;

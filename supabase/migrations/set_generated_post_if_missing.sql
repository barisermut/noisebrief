-- Run this in Supabase SQL editor to fix race condition when two users
-- generate the same tone simultaneously. Only the first write succeeds.
CREATE OR REPLACE FUNCTION set_generated_post_if_missing(
  brief_date date,
  tone_key text,
  post_text text
)
RETURNS void AS $$
BEGIN
  UPDATE public.daily_briefs
  SET generated_posts = jsonb_set(
    COALESCE(generated_posts, '{}'::jsonb),
    ARRAY[tone_key],
    to_jsonb(post_text),
    true
  )
  WHERE date = brief_date
  AND (generated_posts->tone_key) IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Missed when food_log_entries was created — every other owned table got
-- this default from 20260729141000_default_user_id_to_auth_uid.sql, but
-- that ran before this table existed. Same reasoning: clients never pass
-- user_id explicitly, the RLS WITH CHECK still enforces it matches auth.uid().
alter table public.food_log_entries alter column user_id set default auth.uid();

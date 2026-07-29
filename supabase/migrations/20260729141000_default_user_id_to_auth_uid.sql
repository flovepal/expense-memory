-- Defaults user_id to auth.uid() on every owned table, so clients never need
-- to pass it explicitly on insert (and can't accidentally spoof another
-- user's id — the WITH CHECK policies still apply after the default fills
-- in). auth.uid() evaluates to NULL outside of a PostgREST/API request
-- context (e.g. migrations, seed scripts, direct psql), which is exactly
-- what seed.sql relies on to insert system-default categories/subcategories/
-- questions with user_id = NULL.
alter table public.wallets alter column user_id set default auth.uid();
alter table public.categories alter column user_id set default auth.uid();
alter table public.subcategories alter column user_id set default auth.uid();
alter table public.questions alter column user_id set default auth.uid();
alter table public.transactions alter column user_id set default auth.uid();
alter table public.tags alter column user_id set default auth.uid();

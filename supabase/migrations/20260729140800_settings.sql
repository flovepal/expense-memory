-- One row per user; user_id is the primary key (no surrogate key needed for
-- a strict 1:1 relationship with auth.users).
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Nullable on purpose: a settings row is auto-created for every new
  -- auth.users row (see handle_new_auth_user below), which must not be able
  -- to fail just because the currencies seed hasn't run yet in a given
  -- environment. The app falls back to a wallet's own currency when this is
  -- unset.
  default_currency_id uuid references public.currencies(id),
  locale text not null default 'en-US',
  theme text not null default 'system',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_theme_check check (theme in ('light', 'dark', 'system'))
);

create trigger set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

-- No insert/delete grant for clients: rows are created by
-- handle_new_auth_user and removed via cascade when the auth user is
-- deleted.
grant select, update on public.settings to authenticated;

create policy "Users can view their own settings"
  on public.settings for select to authenticated using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Provisions a default settings row for every new auth user (including
-- anonymous sessions from supabase.auth.signInAnonymously()), so the app
-- never has to special-case "no settings row yet".
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_currency uuid;
begin
  select id into default_currency from public.currencies where code = 'USD';

  insert into public.settings (user_id, default_currency_id)
  values (new.id, default_currency)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

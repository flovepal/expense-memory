-- Shops are always personal (no system-shared shops, unlike categories) —
-- created ad-hoc via the shop picker's inline "add new shop" quick-create.
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shops_name_not_blank check (btrim(name) <> '')
);

create unique index shops_user_id_lower_name_key
  on public.shops (user_id, lower(name))
  where deleted_at is null;

create index shops_user_id_idx on public.shops (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

alter table public.shops enable row level security;

grant select, insert, update, delete on public.shops to authenticated;

create policy "Users can view their own shops"
  on public.shops for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own shops"
  on public.shops for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own shops"
  on public.shops for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own shops"
  on public.shops for delete to authenticated using (auth.uid() = user_id);

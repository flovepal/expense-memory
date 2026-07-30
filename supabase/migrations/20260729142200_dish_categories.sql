-- Same nullable-user_id system/custom pattern as categories: NULL rows are
-- shared system defaults (seeded below), non-null rows are a user's own.
create table public.dish_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dish_categories_name_not_blank check (btrim(name) <> '')
);

create unique index dish_categories_system_name_key
  on public.dish_categories (name)
  where deleted_at is null and user_id is null;

create unique index dish_categories_user_name_key
  on public.dish_categories (user_id, name)
  where deleted_at is null and user_id is not null;

create index dish_categories_user_id_idx on public.dish_categories (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.dish_categories
  for each row execute function public.set_updated_at();

alter table public.dish_categories enable row level security;

grant select, insert, update, delete on public.dish_categories to authenticated;

create policy "Users can view system and own dish categories"
  on public.dish_categories for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create their own dish categories"
  on public.dish_categories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own dish categories"
  on public.dish_categories for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own dish categories"
  on public.dish_categories for delete
  to authenticated
  using (auth.uid() = user_id);

-- Seeded directly in a migration (not supabase/seed.sql alone) so it
-- actually reaches the already-populated live database — same reasoning as
-- the TWD currency migration: seed.sql isn't safe to re-run there.
insert into public.dish_categories (name, icon, display_order) values
  ('Beverage', 'cup-soda', 1),
  ('Energy Drink', 'zap', 2),
  ('Burger', 'sandwich', 3),
  ('Fries', 'utensils', 4),
  ('Sandwich', 'sandwich', 5),
  ('Noodles', 'soup', 6),
  ('Rice', 'utensils-crossed', 7),
  ('Dessert', 'ice-cream-cone', 8),
  ('Snack', 'cookie', 9),
  ('Other', 'ellipsis', 10)
on conflict (name) where deleted_at is null and user_id is null do nothing;

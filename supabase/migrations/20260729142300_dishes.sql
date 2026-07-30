-- The per-shop menu catalog. Always personal (shops are personal, so their
-- dishes are too — no system defaults here).
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  dish_category_id uuid references public.dish_categories(id) on delete set null,
  name text not null,
  price numeric(14, 2) not null,
  currency_id uuid references public.currencies(id) on delete set null,
  image_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dishes_name_not_blank check (btrim(name) <> ''),
  constraint dishes_price_nonnegative check (price >= 0)
);

create unique index dishes_shop_id_lower_name_key
  on public.dishes (shop_id, lower(name))
  where deleted_at is null;

create index dishes_shop_id_idx on public.dishes (shop_id) where deleted_at is null;
create index dishes_user_id_idx on public.dishes (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.dishes
  for each row execute function public.set_updated_at();

-- Same pattern as validate_subcategory_category: RLS stops a user from
-- *seeing* another user's shop, not from referencing a guessed shop_id.
create or replace function public.validate_dish_shop_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shop_owner uuid;
begin
  select user_id into shop_owner from public.shops where id = new.shop_id;

  if shop_owner is null then
    raise exception 'shop % does not exist', new.shop_id;
  end if;

  if shop_owner is distinct from new.user_id then
    raise exception 'shop does not belong to this user';
  end if;

  return new;
end;
$$;

create trigger validate_dish_shop_owner
  before insert or update of shop_id, user_id on public.dishes
  for each row execute function public.validate_dish_shop_owner();

alter table public.dishes enable row level security;

grant select, insert, update, delete on public.dishes to authenticated;

create policy "Users can view their own dishes"
  on public.dishes for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own dishes"
  on public.dishes for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own dishes"
  on public.dishes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own dishes"
  on public.dishes for delete to authenticated using (auth.uid() = user_id);

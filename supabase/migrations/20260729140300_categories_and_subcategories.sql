-- user_id is nullable: NULL rows are system defaults, visible to every user
-- but immutable to clients (no insert/update/delete policy matches user_id
-- is null, since auth.uid() is never null for an authenticated session and
-- WITH CHECK requires auth.uid() = user_id).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  transaction_type text not null,
  display_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint categories_transaction_type_check check (transaction_type in ('income', 'expense')),
  constraint categories_name_not_blank check (btrim(name) <> '')
);

create unique index categories_system_name_key
  on public.categories (name, transaction_type)
  where deleted_at is null and user_id is null;

create unique index categories_user_name_key
  on public.categories (user_id, name, transaction_type)
  where deleted_at is null and user_id is not null;

create index categories_user_id_idx on public.categories (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

grant select, insert, update, delete on public.categories to authenticated;

create policy "Users can view system and own categories"
  on public.categories for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create their own categories"
  on public.categories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  to authenticated
  using (auth.uid() = user_id);


create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  display_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint subcategories_name_not_blank check (btrim(name) <> '')
);

create unique index subcategories_system_name_key
  on public.subcategories (category_id, name)
  where deleted_at is null and user_id is null;

create unique index subcategories_user_name_key
  on public.subcategories (category_id, user_id, name)
  where deleted_at is null and user_id is not null;

create index subcategories_category_id_idx on public.subcategories (category_id) where deleted_at is null;
create index subcategories_user_id_idx on public.subcategories (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.subcategories
  for each row execute function public.set_updated_at();

-- Closes a gap RLS alone can't cover: without this, a client could still
-- attach a subcategory to a category id it can't SELECT (e.g. another
-- user's private category) as long as it can guess/obtain the uuid. Runs as
-- security definer so it sees true ownership regardless of the caller's RLS
-- visibility, rather than an RLS-filtered (and therefore bypassable) view.
create or replace function public.validate_subcategory_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_owner uuid;
begin
  select user_id into category_owner from public.categories where id = new.category_id;

  if category_owner is not null and category_owner is distinct from new.user_id then
    raise exception 'subcategory user_id must match its category owner (or the category must be a system default)';
  end if;

  return new;
end;
$$;

create trigger validate_subcategory_category
  before insert or update of category_id, user_id on public.subcategories
  for each row execute function public.validate_subcategory_category();

alter table public.subcategories enable row level security;

grant select, insert, update, delete on public.subcategories to authenticated;

create policy "Users can view system and own subcategories"
  on public.subcategories for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create their own subcategories"
  on public.subcategories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own subcategories"
  on public.subcategories for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own subcategories"
  on public.subcategories for delete
  to authenticated
  using (auth.uid() = user_id);

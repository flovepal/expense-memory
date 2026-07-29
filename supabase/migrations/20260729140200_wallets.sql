create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  currency_id uuid not null references public.currencies(id),
  icon text,
  color text,
  initial_balance numeric(14, 2) not null default 0,
  is_archived boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint wallets_type_check check (
    type in ('cash', 'bank', 'credit_card', 'e_wallet', 'savings', 'investment', 'other')
  ),
  constraint wallets_name_not_blank check (btrim(name) <> '')
);

create unique index wallets_user_id_name_key
  on public.wallets (user_id, name)
  where deleted_at is null;

create index wallets_user_id_idx on public.wallets (user_id) where deleted_at is null;
create index wallets_currency_id_idx on public.wallets (currency_id);

create trigger set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

alter table public.wallets enable row level security;

grant select, insert, update, delete on public.wallets to authenticated;

create policy "Users can view their own wallets"
  on public.wallets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own wallets"
  on public.wallets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own wallets"
  on public.wallets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own wallets"
  on public.wallets for delete
  to authenticated
  using (auth.uid() = user_id);

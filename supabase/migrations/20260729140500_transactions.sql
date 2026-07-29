create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid references public.subcategories(id) on delete restrict,
  transaction_type text not null,
  amount numeric(14, 2) not null,
  occurred_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint transactions_transaction_type_check check (transaction_type in ('income', 'expense')),
  constraint transactions_amount_positive check (amount > 0)
);

create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc)
  where deleted_at is null;

create index transactions_wallet_occurred_idx
  on public.transactions (wallet_id, occurred_at desc)
  where deleted_at is null;

create index transactions_category_idx on public.transactions (category_id) where deleted_at is null;
create index transactions_subcategory_idx on public.transactions (subcategory_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- A transaction's currency is always its wallet's currency (no redundant
-- currency_id column to keep in sync), so this trigger is also where wallet
-- ownership is enforced. It additionally enforces that:
--   - the category's transaction_type matches the transaction's
--   - the subcategory (if any) belongs to the selected category
--   - the category/subcategory/wallet are all visible to this user
-- RLS on the referenced tables prevents a user from ever seeing another
-- user's private rows, but (as with subcategories/questions) doesn't stop a
-- crafted insert from referencing a guessed uuid. security definer lets this
-- check see true ownership regardless of the caller's RLS visibility.
create or replace function public.validate_transaction_references()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_owner uuid;
  wallet_deleted timestamptz;
  cat record;
  subcat record;
begin
  select user_id, deleted_at into wallet_owner, wallet_deleted
  from public.wallets
  where id = new.wallet_id;

  if wallet_owner is null then
    raise exception 'wallet % does not exist', new.wallet_id;
  end if;

  if wallet_owner is distinct from new.user_id then
    raise exception 'wallet does not belong to this user';
  end if;

  if wallet_deleted is not null then
    raise exception 'cannot record a transaction against a deleted wallet';
  end if;

  select id, user_id, transaction_type into cat
  from public.categories
  where id = new.category_id;

  if cat.id is null then
    raise exception 'category % does not exist', new.category_id;
  end if;

  if cat.transaction_type is distinct from new.transaction_type then
    raise exception 'category transaction_type (%) does not match transaction transaction_type (%)', cat.transaction_type, new.transaction_type;
  end if;

  if cat.user_id is not null and cat.user_id is distinct from new.user_id then
    raise exception 'category is not visible to this user';
  end if;

  if new.subcategory_id is not null then
    select id, category_id, user_id into subcat
    from public.subcategories
    where id = new.subcategory_id;

    if subcat.id is null then
      raise exception 'subcategory % does not exist', new.subcategory_id;
    end if;

    if subcat.category_id is distinct from new.category_id then
      raise exception 'subcategory does not belong to the selected category';
    end if;

    if subcat.user_id is not null and subcat.user_id is distinct from new.user_id then
      raise exception 'subcategory is not visible to this user';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_transaction_references
  before insert or update of wallet_id, category_id, subcategory_id, transaction_type, user_id
  on public.transactions
  for each row execute function public.validate_transaction_references();

alter table public.transactions enable row level security;

grant select, insert, update, delete on public.transactions to authenticated;

create policy "Users can view their own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);

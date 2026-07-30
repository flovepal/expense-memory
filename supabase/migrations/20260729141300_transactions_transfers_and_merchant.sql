-- Adds wallet-to-wallet transfers and a merchant/shop-name field to
-- transactions. Transfers are modeled as a single row (not two linked
-- income/expense rows) so create/update/delete stay atomic via the existing
-- create_transaction/update_transaction RPCs, and so the transaction list
-- shows one line per transfer instead of two.
--
-- Same-currency-only for v1: cross-currency transfers would need a manual
-- exchange rate / destination-amount concept that doesn't exist anywhere
-- else in this schema, so validate_transaction_references() below rejects
-- a transfer between wallets with different currency_id.

alter table public.transactions add column to_wallet_id uuid references public.wallets(id) on delete restrict;
alter table public.transactions add column merchant text;
alter table public.transactions alter column category_id drop not null;

alter table public.transactions drop constraint transactions_transaction_type_check;
alter table public.transactions add constraint transactions_transaction_type_check
  check (transaction_type in ('income', 'expense', 'transfer'));

-- Defense in depth alongside validate_transaction_references(): a transfer
-- has no category (categories are income/expense-typed, transfers aren't)
-- and must target a different wallet than its source; income/expense rows
-- keep the original shape.
alter table public.transactions add constraint transactions_transfer_shape_check check (
  (
    transaction_type = 'transfer'
    and category_id is null
    and subcategory_id is null
    and to_wallet_id is not null
    and to_wallet_id <> wallet_id
  )
  or
  (
    transaction_type in ('income', 'expense')
    and category_id is not null
    and to_wallet_id is null
  )
);

create index transactions_to_wallet_occurred_idx
  on public.transactions (to_wallet_id, occurred_at desc)
  where deleted_at is null and to_wallet_id is not null;

create or replace function public.validate_transaction_references()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_owner uuid;
  wallet_deleted timestamptz;
  wallet_currency uuid;
  to_wallet_owner uuid;
  to_wallet_deleted timestamptz;
  to_wallet_currency uuid;
  cat record;
  subcat record;
begin
  select user_id, deleted_at, currency_id into wallet_owner, wallet_deleted, wallet_currency
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

  if new.transaction_type = 'transfer' then
    select user_id, deleted_at, currency_id into to_wallet_owner, to_wallet_deleted, to_wallet_currency
    from public.wallets
    where id = new.to_wallet_id;

    if to_wallet_owner is null then
      raise exception 'destination wallet % does not exist', new.to_wallet_id;
    end if;

    if to_wallet_owner is distinct from new.user_id then
      raise exception 'destination wallet does not belong to this user';
    end if;

    if to_wallet_deleted is not null then
      raise exception 'cannot transfer into a deleted wallet';
    end if;

    if to_wallet_currency is distinct from wallet_currency then
      raise exception 'cannot transfer between wallets with different currencies';
    end if;

    return new;
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

create or replace trigger validate_transaction_references
  before insert or update of wallet_id, category_id, subcategory_id, transaction_type, user_id, to_wallet_id
  on public.transactions
  for each row execute function public.validate_transaction_references();

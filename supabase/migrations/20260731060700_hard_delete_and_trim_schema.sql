-- =============================================================================
-- PART 0 — Drop every view up front.
--
-- transactions_detailed currently selects from tags/transaction_attachments
-- (lateral joins), so it must be dropped before Part 1 can drop those
-- tables — otherwise Postgres refuses with a dependency error. All 4 are
-- recreated from scratch at the very end (Part 2); nothing in between reads
-- from them, so dropping them this early is safe.
-- =============================================================================

drop view if exists public.transactions_detailed;
drop view if exists public.wallet_balances;
drop view if exists public.wallet_monthly_summary;
drop view if exists public.monthly_category_summary;


-- =============================================================================
-- PART 1 — Remove tags and receipt attachments entirely.
--
-- Neither ever came up in how the app is actually used (only dish photos
-- did, which is a separate system: the `dish-images` bucket + `dishes`/
-- `food_log_entries`, untouched here). Dropping both tables, the
-- transaction-attachments storage bucket, and the now-meaningless
-- `suggests_attachment` flag on categories (it existed only to nudge
-- "attach a receipt?", which no longer means anything).
-- =============================================================================

-- create_transaction/update_transaction must be redefined without p_tag_ids
-- before transaction_tags can be dropped. Postgres identifies functions by
-- (name, argument types), so this requires dropping the old signature first
-- (same reasoning as the transfer-params migration).
drop function if exists public.create_transaction(
  uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid[], uuid, text
);
drop function if exists public.update_transaction(
  uuid, uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid[], uuid, text
);

create or replace function public.create_transaction(
  p_wallet_id uuid,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_note text,
  p_answers jsonb,
  p_to_wallet_id uuid default null,
  p_merchant text default null
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_transaction public.transactions;
  v_answer jsonb;
begin
  insert into public.transactions (
    wallet_id, category_id, subcategory_id, transaction_type, amount, occurred_at, note,
    to_wallet_id, merchant
  ) values (
    p_wallet_id, p_category_id, p_subcategory_id, p_transaction_type, p_amount,
    coalesce(p_occurred_at, now()), p_note, p_to_wallet_id, p_merchant
  )
  returning * into v_transaction;

  if p_answers is not null then
    for v_answer in select * from jsonb_array_elements(p_answers)
    loop
      insert into public.transaction_answers (
        transaction_id, question_id, answer_text, answer_number, answer_boolean,
        answer_date, selected_option_id, selected_option_ids
      ) values (
        v_transaction.id,
        (v_answer ->> 'question_id')::uuid,
        v_answer ->> 'answer_text',
        (v_answer ->> 'answer_number')::numeric,
        (v_answer ->> 'answer_boolean')::boolean,
        (v_answer ->> 'answer_date')::date,
        (v_answer ->> 'selected_option_id')::uuid,
        case
          when jsonb_typeof(v_answer -> 'selected_option_ids') = 'array'
            then array(select jsonb_array_elements_text(v_answer -> 'selected_option_ids'))::uuid[]
          else null
        end
      );
    end loop;
  end if;

  return v_transaction;
end;
$$;

grant execute on function public.create_transaction(
  uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid, text
) to authenticated;


create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_wallet_id uuid,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_note text,
  p_answers jsonb,
  p_to_wallet_id uuid default null,
  p_merchant text default null
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_transaction public.transactions;
  v_answer jsonb;
begin
  update public.transactions
  set
    wallet_id = p_wallet_id,
    category_id = p_category_id,
    subcategory_id = p_subcategory_id,
    transaction_type = p_transaction_type,
    amount = p_amount,
    occurred_at = coalesce(p_occurred_at, occurred_at),
    note = p_note,
    to_wallet_id = p_to_wallet_id,
    merchant = p_merchant
  where id = p_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'transaction % not found or not visible to this user', p_transaction_id;
  end if;

  delete from public.transaction_answers where transaction_id = v_transaction.id;

  if p_answers is not null then
    for v_answer in select * from jsonb_array_elements(p_answers)
    loop
      insert into public.transaction_answers (
        transaction_id, question_id, answer_text, answer_number, answer_boolean,
        answer_date, selected_option_id, selected_option_ids
      ) values (
        v_transaction.id,
        (v_answer ->> 'question_id')::uuid,
        v_answer ->> 'answer_text',
        (v_answer ->> 'answer_number')::numeric,
        (v_answer ->> 'answer_boolean')::boolean,
        (v_answer ->> 'answer_date')::date,
        (v_answer ->> 'selected_option_id')::uuid,
        case
          when jsonb_typeof(v_answer -> 'selected_option_ids') = 'array'
            then array(select jsonb_array_elements_text(v_answer -> 'selected_option_ids'))::uuid[]
          else null
        end
      );
    end loop;
  end if;

  return v_transaction;
end;
$$;

grant execute on function public.update_transaction(
  uuid, uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid, text
) to authenticated;

-- transaction_tags depends on tags; drop the join table first. Their
-- ownership-validation trigger functions are standalone objects, not owned
-- by the table — dropping the table only removes the trigger, not the
-- function, so both are dropped explicitly to avoid leaving dead code.
drop table public.transaction_tags;
drop table public.tags;
drop function if exists public.validate_transaction_tag_owner();

drop table public.transaction_attachments;
drop function if exists public.validate_attachment_transaction();

-- The 4 RLS policies for the transaction-attachments bucket. The bucket
-- itself and its objects are NOT dropped here — Supabase restricts direct
-- writes to storage.objects/storage.buckets to the Storage API, not plain
-- SQL, so `delete from storage.objects ...` fails even with migration
-- privileges. Dropping these policies alone is enough to make the bucket
-- functionally dead (RLS defaults to deny-all with no matching policy, so
-- the leftover files become permanently unreachable through the app) —
-- actually deleting the bucket/its files is a separate manual step via the
-- Supabase CLI (`supabase storage rm`) or the dashboard's Storage page.
drop policy if exists "Users can view their own attachment files" on storage.objects;
drop policy if exists "Users can upload their own attachment files" on storage.objects;
drop policy if exists "Users can update their own attachment files" on storage.objects;
drop policy if exists "Users can delete their own attachment files" on storage.objects;

alter table public.categories drop column suggests_attachment;


-- =============================================================================
-- PART 2 — Soft delete -> hard delete.
--
-- No restore feature is planned, so `deleted_at` is pure overhead: an extra
-- filter on every query, an extra column on every table. Dropping it from
-- the 10 tables that had it. The FK behavior this depended on for safety
-- (blocking a wallet/category/subcategory delete while transactions still
-- reference it; nulling out a dish reference on old line items) was already
-- expressed as real FK constraints (RESTRICT / SET NULL) independent of
-- deleted_at, so none of that changes — this migration only removes the
-- column, its indexes, and the views/trigger logic that referenced it.
-- =============================================================================

-- --- Drop every index whose definition touches deleted_at (26 total) -------

-- Unique indexes (9 — tags_user_id_lower_name_key doesn't need dropping,
-- it went with the tags table above)
drop index public.wallets_user_id_name_key;
drop index public.categories_system_name_key;
drop index public.categories_user_name_key;
drop index public.subcategories_system_name_key;
drop index public.subcategories_user_name_key;
drop index public.shops_user_id_lower_name_key;
drop index public.dish_categories_system_name_key;
drop index public.dish_categories_user_name_key;
drop index public.dishes_shop_id_lower_name_key;

-- Plain lookup indexes (17 — tags_user_id_idx also went with the table)
drop index public.wallets_user_id_idx;
drop index public.categories_user_id_idx;
drop index public.subcategories_category_id_idx;
drop index public.subcategories_user_id_idx;
drop index public.questions_category_id_idx;
drop index public.questions_subcategory_id_idx;
drop index public.questions_user_id_idx;
drop index public.transactions_user_occurred_idx;
drop index public.transactions_wallet_occurred_idx;
drop index public.transactions_category_idx;
drop index public.transactions_subcategory_idx;
drop index public.transactions_to_wallet_occurred_idx;
drop index public.shops_user_id_idx;
drop index public.dish_categories_user_id_idx;
drop index public.dishes_shop_id_idx;
drop index public.dishes_user_id_idx;
drop index public.food_log_entries_user_occurred_idx;

-- --- Drop the soft-delete cascade trigger on transactions ------------------
--
-- Added earlier (20260730153100) to clean up transaction_dish_items when a
-- transaction was soft-deleted, since the FK's ON DELETE CASCADE never
-- fired against an UPDATE. It's `after update of deleted_at`, so it must go
-- before that column can be dropped — and it's now fully redundant anyway:
-- a real DELETE on transactions fires the FK cascade directly.
drop trigger if exists cascade_transaction_soft_delete_dish_items on public.transactions;
drop function if exists public.cascade_transaction_soft_delete_dish_items();

-- --- Drop the column itself -------------------------------------------------

alter table public.wallets          drop column deleted_at;
alter table public.categories       drop column deleted_at;
alter table public.subcategories    drop column deleted_at;
alter table public.questions        drop column deleted_at;
alter table public.food_log_entries drop column deleted_at;
alter table public.shops            drop column deleted_at;
alter table public.dish_categories  drop column deleted_at;
alter table public.dishes           drop column deleted_at;
alter table public.transactions     drop column deleted_at;

-- --- Recreate all 26 indexes without the deleted_at predicate --------------

create unique index wallets_user_id_name_key on public.wallets (user_id, name);
create unique index categories_system_name_key on public.categories (name, transaction_type) where user_id is null;
create unique index categories_user_name_key on public.categories (user_id, name, transaction_type) where user_id is not null;
create unique index subcategories_system_name_key on public.subcategories (category_id, name) where user_id is null;
create unique index subcategories_user_name_key on public.subcategories (category_id, user_id, name) where user_id is not null;
create unique index shops_user_id_lower_name_key on public.shops (user_id, lower(name));
create unique index dish_categories_system_name_key on public.dish_categories (name) where user_id is null;
create unique index dish_categories_user_name_key on public.dish_categories (user_id, name) where user_id is not null;
create unique index dishes_shop_id_lower_name_key on public.dishes (shop_id, lower(name));

create index wallets_user_id_idx on public.wallets (user_id);
create index categories_user_id_idx on public.categories (user_id);
create index subcategories_category_id_idx on public.subcategories (category_id);
create index subcategories_user_id_idx on public.subcategories (user_id);
create index questions_category_id_idx on public.questions (category_id);
create index questions_subcategory_id_idx on public.questions (subcategory_id);
create index questions_user_id_idx on public.questions (user_id);
create index transactions_user_occurred_idx on public.transactions (user_id, occurred_at desc);
create index transactions_wallet_occurred_idx on public.transactions (wallet_id, occurred_at desc);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_subcategory_idx on public.transactions (subcategory_id);
create index transactions_to_wallet_occurred_idx on public.transactions (to_wallet_id, occurred_at desc) where to_wallet_id is not null;
create index shops_user_id_idx on public.shops (user_id);
create index dish_categories_user_id_idx on public.dish_categories (user_id);
create index dishes_shop_id_idx on public.dishes (shop_id);
create index dishes_user_id_idx on public.dishes (user_id);
create index food_log_entries_user_occurred_idx on public.food_log_entries (user_id, occurred_at desc);

-- --- Ownership-validation trigger: drop the wallet-deleted checks ----------

create or replace function public.validate_transaction_references()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_owner uuid;
  wallet_currency uuid;
  to_wallet_owner uuid;
  to_wallet_currency uuid;
  cat record;
  subcat record;
begin
  select user_id, currency_id into wallet_owner, wallet_currency
  from public.wallets
  where id = new.wallet_id;

  if wallet_owner is null then
    raise exception 'wallet % does not exist', new.wallet_id;
  end if;

  if wallet_owner is distinct from new.user_id then
    raise exception 'wallet does not belong to this user';
  end if;

  if new.transaction_type = 'transfer' then
    select user_id, currency_id into to_wallet_owner, to_wallet_currency
    from public.wallets
    where id = new.to_wallet_id;

    if to_wallet_owner is null then
      raise exception 'destination wallet % does not exist', new.to_wallet_id;
    end if;

    if to_wallet_owner is distinct from new.user_id then
      raise exception 'destination wallet does not belong to this user';
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

-- --- Recreate the 4 views (already dropped in Part 0): no deleted_at ------
-- --- filters, no tags/attachments -----------------------------------------

create view public.wallet_balances
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.user_id,
  w.name,
  w.type,
  w.currency_id,
  c.code as currency_code,
  c.symbol as currency_symbol,
  c.decimal_digits as currency_decimal_digits,
  w.initial_balance
    + coalesce(
        sum(
          case
            when t.transaction_type = 'income' then t.amount
            when t.transaction_type = 'expense' then -t.amount
            when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
            when t.transaction_type = 'transfer' and t.wallet_id = w.id then -t.amount
            else 0
          end
        ),
        0
      ) as current_balance,
  coalesce(
    sum(
      case
        when t.transaction_type = 'income' then t.amount
        when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
        else 0
      end
    ),
    0
  ) as total_received,
  coalesce(
    sum(
      case
        when t.transaction_type = 'expense' then t.amount
        when t.transaction_type = 'transfer' and t.wallet_id = w.id then t.amount
        else 0
      end
    ),
    0
  ) as total_spent,
  w.is_archived
from public.wallets w
join public.currencies c on c.id = w.currency_id
left join public.transactions t on (t.wallet_id = w.id or t.to_wallet_id = w.id)
group by w.id, c.code, c.symbol, c.decimal_digits;

grant select on public.wallet_balances to authenticated;


create view public.transactions_detailed
with (security_invoker = true) as
select
  t.id,
  t.user_id,
  t.wallet_id,
  w.name as wallet_name,
  w.currency_id,
  c.code as currency_code,
  c.symbol as currency_symbol,
  t.to_wallet_id,
  tw.name as to_wallet_name,
  t.category_id,
  cat.name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  t.subcategory_id,
  sub.name as subcategory_name,
  t.transaction_type,
  t.amount,
  t.occurred_at,
  t.merchant,
  t.note,
  t.created_at,
  t.updated_at,
  coalesce(answers.answer_list, '[]'::jsonb) as answers,
  coalesce(dish_items.dish_item_list, '[]'::jsonb) as dish_items
from public.transactions t
join public.wallets w on w.id = t.wallet_id
join public.currencies c on c.id = w.currency_id
left join public.wallets tw on tw.id = t.to_wallet_id
left join public.categories cat on cat.id = t.category_id
left join public.subcategories sub on sub.id = t.subcategory_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'question_id', ta.question_id,
      'prompt', q.prompt,
      'answer_type', q.answer_type,
      'answer_text', ta.answer_text,
      'answer_number', ta.answer_number,
      'answer_boolean', ta.answer_boolean,
      'answer_date', ta.answer_date,
      'selected_option_id', ta.selected_option_id,
      'selected_option_ids', ta.selected_option_ids
    )
  ) as answer_list
  from public.transaction_answers ta
  join public.questions q on q.id = ta.question_id
  where ta.transaction_id = t.id
) answers on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', tdi.id,
      'dish_id', tdi.dish_id,
      'dish_name', tdi.dish_name,
      'unit_price', tdi.unit_price,
      'quantity', tdi.quantity,
      'image_storage_path', tdi.image_storage_path
    )
    order by tdi.created_at
  ) as dish_item_list
  from public.transaction_dish_items tdi
  where tdi.transaction_id = t.id
) dish_items on true;

grant select on public.transactions_detailed to authenticated;


create view public.wallet_monthly_summary
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.user_id,
  date_trunc('month', t.occurred_at)::date as month,
  sum(
    case
      when t.transaction_type = 'income' then t.amount
      when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
      else 0
    end
  ) as total_received,
  sum(
    case
      when t.transaction_type = 'expense' then t.amount
      when t.transaction_type = 'transfer' and t.wallet_id = w.id then t.amount
      else 0
    end
  ) as total_spent
from public.wallets w
join public.transactions t on (t.wallet_id = w.id or t.to_wallet_id = w.id)
group by w.id, date_trunc('month', t.occurred_at);

grant select on public.wallet_monthly_summary to authenticated;


create view public.monthly_category_summary
with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.occurred_at)::date as month,
  t.category_id,
  cat.name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  t.transaction_type,
  sum(t.amount) as total_amount,
  count(*) as transaction_count
from public.transactions t
join public.categories cat on cat.id = t.category_id
group by t.user_id, date_trunc('month', t.occurred_at), t.category_id, cat.name, cat.icon, cat.color, t.transaction_type;

grant select on public.monthly_category_summary to authenticated;

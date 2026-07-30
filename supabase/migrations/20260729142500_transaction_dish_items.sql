-- One row per dish line on a transaction. Snapshotted (not live-joined) —
-- dish_name/unit_price/currency_id/image_storage_path are copied at
-- selection time so a line survives the dish being renamed/deleted later,
-- same "copy, don't live-join" philosophy as the transaction<->food-log
-- link (transaction_id on delete set null there too).
create table public.transaction_dish_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,

  dish_name text not null,
  unit_price numeric(14, 2) not null,
  quantity integer not null default 1,
  currency_id uuid references public.currencies(id) on delete set null,
  image_storage_path text,

  created_at timestamptz not null default now(),

  constraint transaction_dish_items_dish_name_not_blank check (btrim(dish_name) <> ''),
  constraint transaction_dish_items_unit_price_nonnegative check (unit_price >= 0),
  constraint transaction_dish_items_quantity_positive check (quantity > 0)
);

create index transaction_dish_items_transaction_id_idx
  on public.transaction_dish_items (transaction_id);

create index transaction_dish_items_dish_id_idx
  on public.transaction_dish_items (dish_id)
  where dish_id is not null;

-- Same pattern as validate_attachment_transaction: RLS stops a user from
-- *seeing* another user's transaction, not from referencing a guessed
-- transaction_id on insert.
create or replace function public.validate_transaction_dish_item_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_owner uuid;
begin
  select user_id into txn_owner from public.transactions where id = new.transaction_id;

  if txn_owner is null then
    raise exception 'transaction % does not exist', new.transaction_id;
  end if;

  if txn_owner is distinct from new.user_id then
    raise exception 'transaction does not belong to this user';
  end if;

  return new;
end;
$$;

create trigger validate_transaction_dish_item_owner
  before insert or update of transaction_id, user_id on public.transaction_dish_items
  for each row execute function public.validate_transaction_dish_item_owner();

alter table public.transaction_dish_items enable row level security;

-- No update grant — a line item is removed and re-added rather than edited,
-- same immutability stance as transaction_attachments.
grant select, insert, delete on public.transaction_dish_items to authenticated;

create policy "Users can view their own transaction dish items"
  on public.transaction_dish_items for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own transaction dish items"
  on public.transaction_dish_items for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete their own transaction dish items"
  on public.transaction_dish_items for delete to authenticated using (auth.uid() = user_id);

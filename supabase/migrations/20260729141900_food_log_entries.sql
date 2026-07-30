-- Food log: a quick taste questionnaire per food item, optionally linked to
-- an existing expense transaction for traceability. The link is a snapshot,
-- not a live join — shop/price/date are copied at pick-time so an entry
-- survives even if the source transaction is later edited or deleted.
create table public.food_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  transaction_id uuid references public.transactions(id) on delete set null,

  food_name text not null,
  shop text,
  price numeric(14, 2),
  currency_id uuid references public.currencies(id) on delete set null,
  occurred_at timestamptz not null default now(),

  overall_rating smallint not null,
  flavors text[] not null default '{}',
  texture text[] not null default '{}',
  would_order_again text not null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint food_log_entries_food_name_not_blank check (btrim(food_name) <> ''),
  constraint food_log_entries_price_nonnegative check (price is null or price >= 0),
  constraint food_log_entries_overall_rating_range check (overall_rating between 1 and 5),
  constraint food_log_entries_flavors_allowed
    check (flavors <@ array['sweet','salty','sour','bitter','spicy','umami']::text[]),
  constraint food_log_entries_texture_allowed
    check (texture <@ array['crunchy','crispy','chewy','soft','creamy','tender']::text[]),
  constraint food_log_entries_would_order_again_check
    check (would_order_again in ('yes','no','maybe'))
);

create index food_log_entries_user_occurred_idx
  on public.food_log_entries (user_id, occurred_at desc)
  where deleted_at is null;

create index food_log_entries_transaction_id_idx
  on public.food_log_entries (transaction_id)
  where transaction_id is not null;

create trigger set_updated_at
  before update on public.food_log_entries
  for each row execute function public.set_updated_at();

-- Same pattern as validate_attachment_transaction/validate_transaction_tag_owner:
-- RLS stops a user from *seeing* another user's transaction, not from
-- referencing a guessed transaction_id. transaction_id is nullable here
-- (the link is optional), so a null is a no-op, not an error.
create or replace function public.validate_food_log_transaction_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_owner uuid;
begin
  if new.transaction_id is null then
    return new;
  end if;

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

create trigger validate_food_log_transaction_owner
  before insert or update of transaction_id, user_id on public.food_log_entries
  for each row execute function public.validate_food_log_transaction_owner();

alter table public.food_log_entries enable row level security;

grant select, insert, update, delete on public.food_log_entries to authenticated;

create policy "Users can view their own food log entries"
  on public.food_log_entries for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own food log entries"
  on public.food_log_entries for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own food log entries"
  on public.food_log_entries for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own food log entries"
  on public.food_log_entries for delete to authenticated using (auth.uid() = user_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tags_name_not_blank check (btrim(name) <> '')
);

create unique index tags_user_id_lower_name_key
  on public.tags (user_id, lower(name))
  where deleted_at is null;

create index tags_user_id_idx on public.tags (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

alter table public.tags enable row level security;

grant select, insert, update, delete on public.tags to authenticated;

create policy "Users can view their own tags"
  on public.tags for select to authenticated using (auth.uid() = user_id);

create policy "Users can create their own tags"
  on public.tags for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own tags"
  on public.tags for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own tags"
  on public.tags for delete to authenticated using (auth.uid() = user_id);


create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

create index transaction_tags_tag_id_idx on public.transaction_tags (tag_id);

create or replace function public.validate_transaction_tag_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  txn_owner uuid;
  tag_owner uuid;
begin
  select user_id into txn_owner from public.transactions where id = new.transaction_id;
  select user_id into tag_owner from public.tags where id = new.tag_id;

  if txn_owner is distinct from tag_owner then
    raise exception 'tag and transaction must belong to the same user';
  end if;

  return new;
end;
$$;

create trigger validate_transaction_tag_owner
  before insert on public.transaction_tags
  for each row execute function public.validate_transaction_tag_owner();

alter table public.transaction_tags enable row level security;

grant select, insert, delete on public.transaction_tags to authenticated;

create policy "Users can view tags on their own transactions"
  on public.transaction_tags for select
  to authenticated
  using (
    exists (select 1 from public.transactions t where t.id = transaction_tags.transaction_id and t.user_id = auth.uid())
  );

create policy "Users can tag their own transactions"
  on public.transaction_tags for insert
  to authenticated
  with check (
    exists (select 1 from public.transactions t where t.id = transaction_tags.transaction_id and t.user_id = auth.uid())
    and exists (select 1 from public.tags g where g.id = transaction_tags.tag_id and g.user_id = auth.uid())
  );

create policy "Users can remove tags from their own transactions"
  on public.transaction_tags for delete
  to authenticated
  using (
    exists (select 1 from public.transactions t where t.id = transaction_tags.transaction_id and t.user_id = auth.uid())
  );

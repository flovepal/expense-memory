-- Receipt/photo attachments for transactions. One row per uploaded file;
-- a transaction can have zero, one, or many. Kept as a dedicated table
-- rather than folded into the questions/transaction_answers system, since
-- that system's answer_type is a closed enum with no file/image type and
-- is meant to be generic per-category questions, not attachments.
create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text,
  content_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now(),
  constraint transaction_attachments_storage_path_not_blank check (btrim(storage_path) <> '')
);

create unique index transaction_attachments_storage_path_key on public.transaction_attachments (storage_path);
create index transaction_attachments_transaction_idx on public.transaction_attachments (transaction_id);
create index transaction_attachments_user_id_idx on public.transaction_attachments (user_id);

-- Same pattern as validate_subcategory_category/validate_transaction_references:
-- RLS keeps a user from ever *seeing* another user's transaction, but not
-- from crafting an insert that references a guessed transaction_id. security
-- definer lets this check see true ownership regardless of caller RLS.
create or replace function public.validate_attachment_transaction()
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

create trigger validate_attachment_transaction
  before insert or update of transaction_id, user_id on public.transaction_attachments
  for each row execute function public.validate_attachment_transaction();

alter table public.transaction_attachments enable row level security;

-- No update grant: uploads are immutable (delete + re-upload instead).
grant select, insert, delete on public.transaction_attachments to authenticated;

create policy "Users can view their own transaction attachments"
  on public.transaction_attachments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own transaction attachments"
  on public.transaction_attachments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own transaction attachments"
  on public.transaction_attachments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Private bucket; objects are stored as {user_id}/{transaction_id}/{filename}
-- so storage RLS can scope access by folder without a metadata lookup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transaction-attachments',
  'transaction-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "Users can view their own attachment files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'transaction-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own attachment files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'transaction-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own attachment files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'transaction-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.transaction_answers (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  answer_text text,
  answer_number numeric,
  answer_boolean boolean,
  answer_date date,
  selected_option_id uuid references public.question_options(id),
  selected_option_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_answers_unique_per_question unique (transaction_id, question_id)
);

create index transaction_answers_transaction_id_idx on public.transaction_answers (transaction_id);
create index transaction_answers_question_id_idx on public.transaction_answers (question_id);

create trigger set_updated_at
  before update on public.transaction_answers
  for each row execute function public.set_updated_at();

-- Enforces that exactly one answer column is populated, and that it's the
-- one matching the parent question's answer_type.
create or replace function public.validate_transaction_answer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q record;
  populated_count integer;
begin
  select id, answer_type into q from public.questions where id = new.question_id;

  if q.id is null then
    raise exception 'question % does not exist', new.question_id;
  end if;

  populated_count := (
    (new.answer_text is not null)::int +
    (new.answer_number is not null)::int +
    (new.answer_boolean is not null)::int +
    (new.answer_date is not null)::int +
    (new.selected_option_id is not null)::int +
    (new.selected_option_ids is not null)::int
  );

  if populated_count <> 1 then
    raise exception 'exactly one answer column must be populated';
  end if;

  if q.answer_type = 'text' and new.answer_text is null then
    raise exception 'question expects a text answer';
  elsif q.answer_type = 'number' and new.answer_number is null then
    raise exception 'question expects a number answer';
  elsif q.answer_type = 'boolean' and new.answer_boolean is null then
    raise exception 'question expects a boolean answer';
  elsif q.answer_type = 'date' and new.answer_date is null then
    raise exception 'question expects a date answer';
  elsif q.answer_type = 'single_select' and new.selected_option_id is null then
    raise exception 'question expects a single selected option';
  elsif q.answer_type = 'multi_select' and new.selected_option_ids is null then
    raise exception 'question expects one or more selected options';
  end if;

  return new;
end;
$$;

create trigger validate_transaction_answer
  before insert or update on public.transaction_answers
  for each row execute function public.validate_transaction_answer();

alter table public.transaction_answers enable row level security;

grant select, insert, update, delete on public.transaction_answers to authenticated;

create policy "Users can view answers on their own transactions"
  on public.transaction_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_answers.transaction_id and t.user_id = auth.uid()
    )
  );

create policy "Users can create answers on their own transactions"
  on public.transaction_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_answers.transaction_id and t.user_id = auth.uid()
    )
  );

create policy "Users can update answers on their own transactions"
  on public.transaction_answers for update
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_answers.transaction_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_answers.transaction_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete answers on their own transactions"
  on public.transaction_answers for delete
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_answers.transaction_id and t.user_id = auth.uid()
    )
  );

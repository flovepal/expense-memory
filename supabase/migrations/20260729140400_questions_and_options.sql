create table public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  subcategory_id uuid references public.subcategories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  prompt text not null,
  answer_type text not null,
  is_required boolean not null default false,
  display_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint questions_answer_type_check check (
    answer_type in ('text', 'number', 'boolean', 'single_select', 'multi_select', 'date')
  ),
  constraint questions_prompt_not_blank check (btrim(prompt) <> ''),
  constraint questions_exactly_one_scope check (
    (category_id is not null)::int + (subcategory_id is not null)::int = 1
  )
);

create index questions_category_id_idx on public.questions (category_id) where deleted_at is null;
create index questions_subcategory_id_idx on public.questions (subcategory_id) where deleted_at is null;
create index questions_user_id_idx on public.questions (user_id) where deleted_at is null;

create trigger set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- Same ownership-consistency rule as subcategories: a question's user_id
-- must match the owner of the category/subcategory it scopes to (or that
-- category/subcategory must be a system default).
create or replace function public.validate_question_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  scope_owner uuid;
begin
  if new.category_id is not null then
    select user_id into scope_owner from public.categories where id = new.category_id;
  else
    select user_id into scope_owner from public.subcategories where id = new.subcategory_id;
  end if;

  if scope_owner is not null and scope_owner is distinct from new.user_id then
    raise exception 'question user_id must match the owner of its category/subcategory (or that category/subcategory must be a system default)';
  end if;

  return new;
end;
$$;

create trigger validate_question_scope
  before insert or update of category_id, subcategory_id, user_id on public.questions
  for each row execute function public.validate_question_scope();

alter table public.questions enable row level security;

grant select, insert, update, delete on public.questions to authenticated;

create policy "Users can view system and own questions"
  on public.questions for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create their own questions"
  on public.questions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own questions"
  on public.questions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own questions"
  on public.questions for delete
  to authenticated
  using (auth.uid() = user_id);


create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  value text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_options_label_not_blank check (btrim(label) <> ''),
  constraint question_options_value_not_blank check (btrim(value) <> '')
);

create unique index question_options_question_id_value_key on public.question_options (question_id, value);
create index question_options_question_id_idx on public.question_options (question_id);

create trigger set_updated_at
  before update on public.question_options
  for each row execute function public.set_updated_at();

create or replace function public.validate_question_option_answer_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q_answer_type text;
begin
  select answer_type into q_answer_type from public.questions where id = new.question_id;

  if q_answer_type not in ('single_select', 'multi_select') then
    raise exception 'question_options can only be added to single_select or multi_select questions';
  end if;

  return new;
end;
$$;

create trigger validate_question_option_answer_type
  before insert on public.question_options
  for each row execute function public.validate_question_option_answer_type();

alter table public.question_options enable row level security;

grant select, insert, update, delete on public.question_options to authenticated;

create policy "Users can view options for visible questions"
  on public.question_options for select
  to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id
        and (q.user_id is null or q.user_id = auth.uid())
    )
  );

create policy "Users can create options for their own questions"
  on public.question_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id and q.user_id = auth.uid()
    )
  );

create policy "Users can update options for their own questions"
  on public.question_options for update
  to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id and q.user_id = auth.uid()
    )
  );

create policy "Users can delete options for their own questions"
  on public.question_options for delete
  to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id and q.user_id = auth.uid()
    )
  );

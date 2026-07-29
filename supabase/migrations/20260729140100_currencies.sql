-- Global reference data: no user_id, no soft delete. Writable only by
-- migrations/seed (service role) — regular users can only read.
create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  code char(3) not null,
  name text not null,
  symbol text not null,
  decimal_digits smallint not null default 2,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint currencies_code_uppercase check (code = upper(code)),
  constraint currencies_decimal_digits_range check (decimal_digits between 0 and 6)
);

create unique index currencies_code_key on public.currencies (code);

create trigger set_updated_at
  before update on public.currencies
  for each row execute function public.set_updated_at();

alter table public.currencies enable row level security;

grant select on public.currencies to authenticated;

create policy "Currencies are readable by authenticated users"
  on public.currencies for select
  to authenticated
  using (true);

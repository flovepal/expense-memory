# Flovepal DJ — Decision Jenome

A transaction-tracking app with a dynamic, per-category question system —
built as a standalone module intended to be embedded into **Flovepal Grove**
later.

## Tech stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------- |
| Frontend   | React 19 + TypeScript + Vite                                        |
| Styling    | Tailwind CSS v4 + shadcn/ui (Base UI primitives)                     |
| Data       | Supabase (Postgres + Auth + Row Level Security)                     |
| Server state | TanStack Query                                                     |
| Forms      | React Hook Form + Zod                                                |
| Routing    | React Router v7 (route-level code splitting via `lazy`)              |
| Icons      | lucide-react                                                        |

## Architecture

Feature-based structure — each domain owns its hooks and components; nothing
outside `services/repositories` talks to Supabase directly.

```
src/
  components/
    ui/            shadcn primitives (generated, don't hand-edit)
    shared/         LoadingState, ErrorState, EmptyState — reused everywhere
    layout/         AppShell (top nav + outlet)
  features/
    wallets/        components/, hooks/, schemas.ts, wallets-page.tsx
    transactions/    same shape — includes the dynamic question form
    categories/       "        " — categories + subcategories + questions
    tags/
    dashboard/
    settings/
    currencies/     read-only reference data hook
  hooks/            cross-cutting hooks (use-auth.tsx)
  lib/
    supabase/       client.ts, errors.ts, database.types.ts (generated)
    query-client.ts, toast.ts, format.ts, utils.ts
  services/
    repositories/   one class per table/domain — the only layer touching supabase
  types/            database.ts (generic Tables/Views helpers), enums.ts
  routes/           React Router route tree
```

**Repositories → Hooks → Components** is the only allowed data-flow direction.
A component never imports `@/lib/supabase/client` directly.

## Database

10 tables, 3 views, RLS on every table. Full design rationale lives in the
migration files themselves (`supabase/migrations/*.sql`) as comments — read
those before changing the schema.

### Entities

- **currencies** — global reference data (ISO code, symbol, decimal digits).
- **wallets** — user-owned; `type` is a `CHECK`-constrained enum (cash, bank,
  credit_card, e_wallet, savings, investment, other).
- **categories** / **subcategories** — `user_id` is **nullable**: `NULL` means
  a shared system default (seeded, visible to everyone, read-only to
  clients); non-null means a user's own custom category. Categories are
  scoped to `income` or `expense` via `transaction_type`.
- **questions** / **question_options** — the dynamic-question system. A
  question attaches to exactly one of `category_id` / `subcategory_id`
  (enforced by a `CHECK`), and follows the same nullable-`user_id` system/
  custom pattern. `answer_type` is one of `text | number | boolean |
  single_select | multi_select | date`; `question_options` only makes sense
  for the two `*_select` types (enforced by trigger).
- **transactions** — one wallet, one category, optional subcategory, signed
  by `transaction_type`. Does **not** store its own currency — a
  transaction's currency is always its wallet's currency, so there's nothing
  to keep in sync. A trigger validates that the category's
  `transaction_type` matches, the subcategory belongs to the category, and
  everything referenced (wallet/category/subcategory) is actually visible to
  the acting user.
- **transaction_answers** — one row per (transaction, question). Exactly one
  of its six answer columns is populated, matching the question's
  `answer_type` (enforced by trigger).
- **tags** / **transaction_tags** — free-form user tags, many-to-many with
  transactions.
- **settings** — one row per user (`user_id` is the primary key). Created
  automatically by a trigger on `auth.users` insert, so it always exists
  before the client needs it. `preferences` is the one deliberate `jsonb`
  column — free-form UI prefs that don't need relational querying.

### Views

- `wallet_balances` — `initial_balance + Σ(signed transaction amounts)` per
  wallet, joined to its currency.
- `transactions_detailed` — one row per transaction with wallet/category/
  subcategory/currency joined in, plus tags and answers aggregated as
  `jsonb` — built for the transaction list/feed to avoid N+1 queries.
- `monthly_category_summary` — per-user, per-month, per-category totals for
  the dashboard.

All three are declared `with (security_invoker = true)`, so they enforce RLS
as the querying user rather than the view owner — without this they'd
silently bypass every RLS policy on their base tables.

### RLS pattern

- Reference data (`currencies`): `SELECT` for `authenticated`; no client
  writes.
- Nullable-owner tables (`categories`, `subcategories`, `questions`):
  `SELECT` where `user_id IS NULL OR user_id = auth.uid()`; writes require
  `user_id = auth.uid()` (system rows are immutable to clients).
- Strictly-owned tables (`wallets`, `tags`, `transactions`, `settings`):
  `auth.uid() = user_id` on every operation.
- Child tables (`transaction_answers`, `transaction_tags`,
  `question_options`): scoped via `EXISTS` against the parent row's
  ownership.
- `user_id` **defaults to `auth.uid()`** on every owned table (see
  `20260729141000_default_user_id_to_auth_uid.sql`), so repository `create()`
  calls never pass it explicitly — one less way to get it wrong, and it can't
  be spoofed since the `WITH CHECK` policy still runs after the default
  fills in.

### Atomic writes via RPC

Creating or updating a transaction touches three tables (`transactions`,
`transaction_answers`, `transaction_tags`). Doing that as separate REST calls
risks a partial write if a later call fails. `create_transaction` and
`update_transaction` (both `security invoker`) wrap the whole thing in one
Postgres function call, which runs as a single atomic statement — any
exception (e.g. a validation trigger rejecting a bad category) rolls back
everything, including the `transactions` row itself.

## Auth

There's no login UI yet. The app bootstraps an **anonymous Supabase Auth
session** (`supabase.auth.signInAnonymously()`) on first load, so
`auth.uid()` is always populated and every RLS policy above is the *real*
policy from day one — nothing is relaxed for the no-login state. A future
login screen can upgrade that same anonymous session to a real account via
`supabase.auth.linkIdentity()` with zero data migration, since everything
stays attached to the same user id.

**Anonymous Sign-Ins must be enabled on the Supabase project** — it's an
Auth provider setting, not something a migration can turn on:
Dashboard → **Authentication** → **Sign In / Providers** → **Anonymous
Sign-Ins** → on.

## Getting started

```bash
npm install
```

Copy `.env.local` (already present in this repo) and confirm it has:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Database setup (already linked to a live Supabase project)

```bash
supabase link --project-ref <your-project-ref>   # already done for this project
supabase db push                                  # applies supabase/migrations/*.sql
supabase db push --include-seed                   # applies supabase/seed.sql (currencies, default categories/questions)
```

Regenerate types any time the schema changes:

```bash
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

### Run the app

```bash
npm run dev      # start Vite dev server
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build locally
```

## Adding a new migration

Never hand-edit an already-applied migration. Add a new one:

```bash
supabase migration new some_change
# edit the generated supabase/migrations/<timestamp>_some_change.sql
supabase db push
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Gotchas worth knowing before you touch this code

- **Base UI `<Select>` needs an `items` prop, or it shows the raw value.**
  Unlike Radix's shadcn Select, `@base-ui/react`'s `Select.Value` only
  renders a matching `<SelectItem>`'s label automatically if you also pass
  `items={{ [value]: label }}` (or an array of `{ value, label }`) to the
  root `<Select>`. Skip it and every select showing dynamic data (wallets,
  categories, currencies, question options) will display raw UUIDs instead
  of names. Every `<Select>` in this codebase already does this — copy that
  pattern for new ones.
- **Postgres `jsonb -> key` returns a JSON `null` scalar, not SQL `NULL`,
  when the key is present with an explicit null value.** `create_transaction`
  / `update_transaction` originally checked `v_answer -> 'selected_option_ids'
  is not null` to decide whether to iterate it as an array, which is true
  even for `{"selected_option_ids": null}` — then `jsonb_array_elements_text`
  throws `22023 cannot extract elements from a scalar`. Use
  `jsonb_typeof(...) = 'array'` instead when branching on whether a jsonb
  value is actually an array.
- **Build local date strings from date parts, not `Date.toISOString()`.**
  `new Date(year, month, 1).toISOString().slice(0, 10)` converts through
  UTC, which rolls the 1st back to the last day of the previous month for
  any positive UTC-offset timezone (e.g. local midnight July 1 at UTC+8 is
  June 30 16:00 UTC). `dashboard-page.tsx`'s `firstOfMonth()` builds the
  string directly from `getFullYear()`/`getMonth()` instead — do the same
  for any other local-calendar-date formatting.

## Known limitations / next steps

- **Dashboard category totals don't convert currency.** If a user has
  wallets in more than one currency, `monthly_category_summary` sums raw
  amounts across all of them — the totals silently mix currencies. Adding
  exchange rates and a base-currency conversion is future work, not
  implemented here.
- **No login UI yet.** Anonymous sessions work end-to-end (including RLS),
  but there's no screen to upgrade an anonymous session to a real
  email/password or OAuth account via `linkIdentity()` — that's the natural
  next step before this ships as a real multi-device product.
- **Transfers between wallets** are intentionally out of scope for v1
  (`transactions.transaction_type` is `income | expense` only). Adding a
  `transfer` type with a `to_wallet_id` is an additive migration.
- Environment note: this repo was originally scaffolded on Windows inside a
  `Downloads` folder, where antivirus real-time scanning was silently
  corrupting some `npm install` extractions (packages would report as
  installed but be missing from disk). If `npm run build` ever fails with a
  "Cannot find module" error for a package that's clearly listed in
  `package.json`, that's the likely cause — reinstall, or move the project
  out of a heavily-scanned folder (e.g. `Downloads`) if it recurs.

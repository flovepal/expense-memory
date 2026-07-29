-- Seed data for local development (auto-applied by `supabase db reset`).
-- Everything here is system/reference data: currencies have no owner, and
-- categories/subcategories/questions are seeded with user_id = NULL so they
-- are visible to every user as read-only defaults.
--
-- To apply this to the LINKED remote project, run:
--   supabase db push --include-seed
-- or paste this file into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Currencies
-- ---------------------------------------------------------------------------
insert into public.currencies (code, name, symbol, decimal_digits) values
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('PHP', 'Philippine Peso', '₱', 2),
  ('INR', 'Indian Rupee', '₹', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('CAD', 'Canadian Dollar', 'C$', 2),
  ('SGD', 'Singapore Dollar', 'S$', 2),
  ('CNY', 'Chinese Yuan', '¥', 2)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Default expense categories + subcategories
-- ---------------------------------------------------------------------------
with expense_categories as (
  insert into public.categories (name, icon, color, transaction_type, display_order) values
    ('Food', 'utensils', '#f97316', 'expense', 1),
    ('Transport', 'car', '#3b82f6', 'expense', 2),
    ('Housing', 'home', '#8b5cf6', 'expense', 3),
    ('Entertainment', 'clapperboard', '#ec4899', 'expense', 4),
    ('Health', 'heart-pulse', '#ef4444', 'expense', 5),
    ('Shopping', 'shopping-bag', '#14b8a6', 'expense', 6),
    ('Other', 'ellipsis', '#6b7280', 'expense', 7)
  returning id, name
)
insert into public.subcategories (category_id, name, icon, display_order)
select id, sub.name, sub.icon, sub.display_order
from expense_categories
join lateral (
  values
    ('Food', 'Groceries', 'shopping-cart', 1),
    ('Food', 'Dining Out', 'utensils-crossed', 2),
    ('Food', 'Coffee', 'coffee', 3),
    ('Transport', 'Fuel', 'fuel', 1),
    ('Transport', 'Public Transit', 'bus', 2),
    ('Transport', 'Ride-hailing', 'car-taxi-front', 3),
    ('Housing', 'Rent', 'key-round', 1),
    ('Housing', 'Utilities', 'plug-zap', 2),
    ('Housing', 'Maintenance', 'wrench', 3)
) as sub(category_name, name, icon, display_order) on sub.category_name = expense_categories.name;

-- ---------------------------------------------------------------------------
-- Default income categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, icon, color, transaction_type, display_order) values
  ('Salary', 'banknote', '#22c55e', 'income', 1),
  ('Freelance', 'briefcase', '#0ea5e9', 'income', 2),
  ('Investment', 'trending-up', '#a855f7', 'income', 3),
  ('Gifts', 'gift', '#f59e0b', 'income', 4),
  ('Other', 'ellipsis', '#6b7280', 'income', 5);

-- ---------------------------------------------------------------------------
-- Default questions: prove the dynamic-question system end to end.
-- "Was this planned?" on every expense category, plus one category-specific
-- single_select question on Food.
-- ---------------------------------------------------------------------------
insert into public.questions (category_id, prompt, answer_type, is_required, display_order)
select id, 'Was this planned?', 'boolean', false, 1
from public.categories
where transaction_type = 'expense' and user_id is null;

with food_question as (
  insert into public.questions (category_id, prompt, answer_type, is_required, display_order)
  select id, 'Who was this with?', 'single_select', false, 2
  from public.categories
  where name = 'Food' and transaction_type = 'expense' and user_id is null
  returning id
)
insert into public.question_options (question_id, label, value, display_order)
select id, opt.label, opt.value, opt.display_order
from food_question
join lateral (
  values
    ('Alone', 'alone', 1),
    ('Family', 'family', 2),
    ('Friends', 'friends', 3),
    ('Colleagues', 'colleagues', 4)
) as opt(label, value, display_order) on true;

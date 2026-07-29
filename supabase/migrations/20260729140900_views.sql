-- security_invoker = true makes every view enforce RLS as the querying
-- user, not the view owner. Without it these views would silently bypass
-- the RLS policies defined on their base tables.

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
            else 0
          end
        ) filter (where t.deleted_at is null),
        0
      ) as current_balance,
  w.is_archived,
  w.deleted_at
from public.wallets w
join public.currencies c on c.id = w.currency_id
left join public.transactions t on t.wallet_id = w.id and t.deleted_at is null
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
  t.category_id,
  cat.name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  t.subcategory_id,
  sub.name as subcategory_name,
  t.transaction_type,
  t.amount,
  t.occurred_at,
  t.note,
  t.created_at,
  t.updated_at,
  coalesce(tags.tag_list, '[]'::jsonb) as tags,
  coalesce(answers.answer_list, '[]'::jsonb) as answers
from public.transactions t
join public.wallets w on w.id = t.wallet_id
join public.currencies c on c.id = w.currency_id
join public.categories cat on cat.id = t.category_id
left join public.subcategories sub on sub.id = t.subcategory_id
left join lateral (
  select jsonb_agg(jsonb_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)) as tag_list
  from public.transaction_tags tt
  join public.tags tg on tg.id = tt.tag_id
  where tt.transaction_id = t.id
) tags on true
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
where t.deleted_at is null;

grant select on public.transactions_detailed to authenticated;


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
where t.deleted_at is null
group by t.user_id, date_trunc('month', t.occurred_at), t.category_id, cat.name, cat.icon, cat.color, t.transaction_type;

grant select on public.monthly_category_summary to authenticated;

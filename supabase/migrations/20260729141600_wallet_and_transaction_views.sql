-- Rebuilds wallet_balances and transactions_detailed to be transfer-aware,
-- and adds wallet_monthly_summary for the dashboard's this-month toggle.
-- Views hold no data and nothing else in the schema depends on them, so
-- drop + recreate is safe.

drop view if exists public.wallet_balances;

-- total_received/total_spent are lifetime, wallet-level totals that
-- *include* transfer legs (an incoming transfer is money received into a
-- wallet, an outgoing transfer is money spent from it) — a different
-- semantic from monthly_category_summary's income/expense totals, which
-- deliberately exclude transfers. Named differently on purpose.
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
            when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
            when t.transaction_type = 'transfer' and t.wallet_id = w.id then -t.amount
            else 0
          end
        ) filter (where t.deleted_at is null),
        0
      ) as current_balance,
  coalesce(
    sum(
      case
        when t.transaction_type = 'income' then t.amount
        when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
        else 0
      end
    ) filter (where t.deleted_at is null),
    0
  ) as total_received,
  coalesce(
    sum(
      case
        when t.transaction_type = 'expense' then t.amount
        when t.transaction_type = 'transfer' and t.wallet_id = w.id then t.amount
        else 0
      end
    ) filter (where t.deleted_at is null),
    0
  ) as total_spent,
  w.is_archived,
  w.deleted_at
from public.wallets w
join public.currencies c on c.id = w.currency_id
left join public.transactions t
  on (t.wallet_id = w.id or t.to_wallet_id = w.id) and t.deleted_at is null
group by w.id, c.code, c.symbol, c.decimal_digits;

grant select on public.wallet_balances to authenticated;


drop view if exists public.transactions_detailed;

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
  t.to_wallet_id,
  tw.name as to_wallet_name,
  t.category_id,
  cat.name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  t.subcategory_id,
  sub.name as subcategory_name,
  t.transaction_type,
  t.amount,
  t.occurred_at,
  t.merchant,
  t.note,
  t.created_at,
  t.updated_at,
  coalesce(tags.tag_list, '[]'::jsonb) as tags,
  coalesce(answers.answer_list, '[]'::jsonb) as answers,
  coalesce(attachments.attachment_list, '[]'::jsonb) as attachments
from public.transactions t
join public.wallets w on w.id = t.wallet_id
join public.currencies c on c.id = w.currency_id
left join public.wallets tw on tw.id = t.to_wallet_id
left join public.categories cat on cat.id = t.category_id
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
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', att.id,
      'storage_path', att.storage_path,
      'file_name', att.file_name,
      'uploaded_at', att.uploaded_at
    )
    order by att.uploaded_at
  ) as attachment_list
  from public.transaction_attachments att
  where att.transaction_id = t.id
) attachments on true
where t.deleted_at is null;

grant select on public.transactions_detailed to authenticated;


-- Per-wallet, per-month received/spent (same transfer-aware logic as
-- wallet_balances), for the dashboard's all-time/this-month toggle. Inner
-- join like monthly_category_summary: no row for a wallet with zero
-- activity in a given month.
create view public.wallet_monthly_summary
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.user_id,
  date_trunc('month', t.occurred_at)::date as month,
  sum(
    case
      when t.transaction_type = 'income' then t.amount
      when t.transaction_type = 'transfer' and t.to_wallet_id = w.id then t.amount
      else 0
    end
  ) as total_received,
  sum(
    case
      when t.transaction_type = 'expense' then t.amount
      when t.transaction_type = 'transfer' and t.wallet_id = w.id then t.amount
      else 0
    end
  ) as total_spent
from public.wallets w
join public.transactions t
  on (t.wallet_id = w.id or t.to_wallet_id = w.id) and t.deleted_at is null
group by w.id, date_trunc('month', t.occurred_at);

grant select on public.wallet_monthly_summary to authenticated;

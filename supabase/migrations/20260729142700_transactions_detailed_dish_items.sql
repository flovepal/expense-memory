-- Adds a dish_items lateral-joined array to transactions_detailed, same
-- shape as the existing tags/answers/attachments arrays. Drop + recreate is
-- safe: views hold no data and nothing else in the schema depends on this
-- one (confirmed when it was last rebuilt this session).

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
  coalesce(attachments.attachment_list, '[]'::jsonb) as attachments,
  coalesce(dish_items.dish_item_list, '[]'::jsonb) as dish_items
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
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', tdi.id,
      'dish_id', tdi.dish_id,
      'dish_name', tdi.dish_name,
      'unit_price', tdi.unit_price,
      'quantity', tdi.quantity,
      'image_storage_path', tdi.image_storage_path
    )
    order by tdi.created_at
  ) as dish_item_list
  from public.transaction_dish_items tdi
  where tdi.transaction_id = t.id
) dish_items on true
where t.deleted_at is null;

grant select on public.transactions_detailed to authenticated;

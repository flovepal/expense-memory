-- Fixes a bug in create_transaction/update_transaction: `jsonb -> key` returns
-- a JSON 'null' scalar (not SQL NULL) when the key is present with an
-- explicit null value, e.g. {"selected_option_ids": null}. The previous
-- `is not null` check treated that JSON-null scalar as "present", then
-- jsonb_array_elements_text() choked trying to iterate a scalar
-- ("cannot extract elements from a scalar", 22023). Checking
-- jsonb_typeof(...) = 'array' instead correctly distinguishes a real array
-- from an absent/JSON-null value.

create or replace function public.create_transaction(
  p_wallet_id uuid,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_note text,
  p_answers jsonb,
  p_tag_ids uuid[]
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_transaction public.transactions;
  v_answer jsonb;
begin
  insert into public.transactions (
    wallet_id, category_id, subcategory_id, transaction_type, amount, occurred_at, note
  ) values (
    p_wallet_id, p_category_id, p_subcategory_id, p_transaction_type, p_amount,
    coalesce(p_occurred_at, now()), p_note
  )
  returning * into v_transaction;

  if p_answers is not null then
    for v_answer in select * from jsonb_array_elements(p_answers)
    loop
      insert into public.transaction_answers (
        transaction_id, question_id, answer_text, answer_number, answer_boolean,
        answer_date, selected_option_id, selected_option_ids
      ) values (
        v_transaction.id,
        (v_answer ->> 'question_id')::uuid,
        v_answer ->> 'answer_text',
        (v_answer ->> 'answer_number')::numeric,
        (v_answer ->> 'answer_boolean')::boolean,
        (v_answer ->> 'answer_date')::date,
        (v_answer ->> 'selected_option_id')::uuid,
        case
          when jsonb_typeof(v_answer -> 'selected_option_ids') = 'array'
            then array(select jsonb_array_elements_text(v_answer -> 'selected_option_ids'))::uuid[]
          else null
        end
      );
    end loop;
  end if;

  if p_tag_ids is not null and array_length(p_tag_ids, 1) > 0 then
    insert into public.transaction_tags (transaction_id, tag_id)
    select v_transaction.id, tag_id from unnest(p_tag_ids) as tag_id;
  end if;

  return v_transaction;
end;
$$;

create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_wallet_id uuid,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_note text,
  p_answers jsonb,
  p_tag_ids uuid[]
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_transaction public.transactions;
  v_answer jsonb;
begin
  update public.transactions
  set
    wallet_id = p_wallet_id,
    category_id = p_category_id,
    subcategory_id = p_subcategory_id,
    transaction_type = p_transaction_type,
    amount = p_amount,
    occurred_at = coalesce(p_occurred_at, occurred_at),
    note = p_note
  where id = p_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'transaction % not found or not visible to this user', p_transaction_id;
  end if;

  delete from public.transaction_answers where transaction_id = v_transaction.id;

  if p_answers is not null then
    for v_answer in select * from jsonb_array_elements(p_answers)
    loop
      insert into public.transaction_answers (
        transaction_id, question_id, answer_text, answer_number, answer_boolean,
        answer_date, selected_option_id, selected_option_ids
      ) values (
        v_transaction.id,
        (v_answer ->> 'question_id')::uuid,
        v_answer ->> 'answer_text',
        (v_answer ->> 'answer_number')::numeric,
        (v_answer ->> 'answer_boolean')::boolean,
        (v_answer ->> 'answer_date')::date,
        (v_answer ->> 'selected_option_id')::uuid,
        case
          when jsonb_typeof(v_answer -> 'selected_option_ids') = 'array'
            then array(select jsonb_array_elements_text(v_answer -> 'selected_option_ids'))::uuid[]
          else null
        end
      );
    end loop;
  end if;

  delete from public.transaction_tags where transaction_id = v_transaction.id;

  if p_tag_ids is not null and array_length(p_tag_ids, 1) > 0 then
    insert into public.transaction_tags (transaction_id, tag_id)
    select v_transaction.id, tag_id from unnest(p_tag_ids) as tag_id;
  end if;

  return v_transaction;
end;
$$;

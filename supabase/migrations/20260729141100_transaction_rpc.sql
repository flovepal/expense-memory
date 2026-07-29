-- Creating/updating a transaction touches three tables (transactions,
-- transaction_answers, transaction_tags). Doing that as separate REST calls
-- from the client risks a partial write if a later call fails. These RPCs
-- wrap the whole thing in one function call, which Postgres runs as a
-- single atomic statement — any exception (e.g. the validate_transaction_*
-- triggers rejecting a bad category) rolls back everything, including the
-- transactions row itself.
--
-- Both are `security invoker` (the plpgsql default, stated explicitly) so
-- they run as the calling user: RLS on transactions/transaction_answers/
-- transaction_tags, and the ownership-validating triggers on transactions,
-- apply exactly as if the client had issued the statements directly. No
-- privilege escalation.

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
          when v_answer -> 'selected_option_ids' is not null
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

grant execute on function public.create_transaction(
  uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid[]
) to authenticated;


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
          when v_answer -> 'selected_option_ids' is not null
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

grant execute on function public.update_transaction(
  uuid, uuid, uuid, uuid, text, numeric, timestamptz, text, jsonb, uuid[]
) to authenticated;

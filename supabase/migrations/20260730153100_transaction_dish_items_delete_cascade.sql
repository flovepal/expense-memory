-- transaction_dish_items has "on delete cascade" on transaction_id, but
-- transactions are soft-deleted (deleted_at set, row never actually
-- removed), so that FK cascade never fires and dish line items from a
-- deleted transaction linger forever. Mirror the soft-delete with an actual
-- cleanup of this snapshot-only child table, which has no independent value
-- once its parent transaction is gone.
create or replace function public.cascade_transaction_soft_delete_dish_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.transaction_dish_items where transaction_id = old.id;
  end if;
  return new;
end;
$$;

create trigger cascade_transaction_soft_delete_dish_items
  after update of deleted_at on public.transactions
  for each row execute function public.cascade_transaction_soft_delete_dish_items();

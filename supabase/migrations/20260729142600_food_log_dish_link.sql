-- Optional link from a food log entry to the dish it was logged from —
-- same snapshot-not-join stance as the existing transaction_id link
-- (on delete set null so the entry survives the dish being deleted).
-- Purely additive: all nullable, no existing row is affected.
alter table public.food_log_entries
  add column dish_id uuid references public.dishes(id) on delete set null,
  add column dish_category_id uuid references public.dish_categories(id) on delete set null,
  add column image_storage_path text;

create index food_log_entries_dish_id_idx
  on public.food_log_entries (dish_id)
  where dish_id is not null;

create index food_log_entries_dish_category_id_idx
  on public.food_log_entries (dish_category_id)
  where dish_category_id is not null;

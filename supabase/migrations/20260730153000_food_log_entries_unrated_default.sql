-- A dish is now logged the moment it's added to a Food transaction, not just
-- when the user finishes the taste questionnaire — see the app-side
-- "auto-create a placeholder entry per new dish" change. overall_rating 0
-- means "not rated yet" (renders as empty stars) and would_order_again
-- becomes optional for the same reason; the app's edit form still requires
-- both to be filled in before a real save.
alter table public.food_log_entries alter column overall_rating set default 0;
alter table public.food_log_entries alter column would_order_again drop not null;

alter table public.food_log_entries drop constraint food_log_entries_overall_rating_range;
alter table public.food_log_entries add constraint food_log_entries_overall_rating_range
  check (overall_rating between 0 and 5);

alter table public.food_log_entries drop constraint food_log_entries_would_order_again_check;
alter table public.food_log_entries add constraint food_log_entries_would_order_again_check
  check (would_order_again is null or would_order_again in ('yes','no','maybe'));

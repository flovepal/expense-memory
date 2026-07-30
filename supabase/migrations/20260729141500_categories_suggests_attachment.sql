-- Data-driven flag for "prompt for a receipt photo when this category is
-- selected", rather than hardcoding a category name in the client. Seeded
-- true only for the system default Shopping category; users can opt their
-- own custom categories in via the category form.
alter table public.categories add column suggests_attachment boolean not null default false;

update public.categories
set suggests_attachment = true
where name = 'Shopping' and transaction_type = 'expense' and user_id is null and deleted_at is null;

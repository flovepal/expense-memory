insert into public.currencies (code, name, symbol, decimal_digits)
values ('TWD', 'New Taiwan Dollar', 'NT$', 2)
on conflict (code) do nothing;

alter table public.treasury_general_movements
add column if not exists is_expense_closed boolean;

update public.treasury_general_movements
set is_expense_closed = false
where is_expense_closed is null;

alter table public.treasury_general_movements
alter column is_expense_closed set default false;

alter table public.treasury_general_movements
alter column is_expense_closed set not null;

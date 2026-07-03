begin;

alter table public.treasury_members
add column if not exists is_guest boolean not null default false;

notify pgrst, 'reload schema';

commit;

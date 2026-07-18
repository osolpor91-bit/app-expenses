create extension if not exists pgcrypto;

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  code varchar(100) not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warehouses_code_uppercase_check check (code = upper(code)),
  constraint warehouses_company_code_key unique (tenant_id, company_id, code)
);

create unique index warehouses_one_default_per_company_idx
  on public.warehouses (tenant_id, company_id)
  where is_default;

alter table public.warehouses enable row level security;

create policy "Tenant users can read warehouses"
  on public.warehouses
  for select
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = warehouses.tenant_id
        and tu.user_id = auth.uid()
        and tu.status = 'active'
    )
  );

create policy "Tenant users can insert warehouses"
  on public.warehouses
  for insert
  with check (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = warehouses.tenant_id
        and tu.user_id = auth.uid()
        and tu.status = 'active'
    )
  );

create policy "Tenant users can update warehouses"
  on public.warehouses
  for update
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = warehouses.tenant_id
        and tu.user_id = auth.uid()
        and tu.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = warehouses.tenant_id
        and tu.user_id = auth.uid()
        and tu.status = 'active'
    )
  );

create policy "Tenant users can delete warehouses"
  on public.warehouses
  for delete
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = warehouses.tenant_id
        and tu.user_id = auth.uid()
        and tu.status = 'active'
    )
  );

insert into public.warehouses (
  tenant_id,
  company_id,
  code,
  description,
  is_default
)
select
  c.tenant_id,
  c.id,
  'GENERAL',
  'Almacen general',
  true
from public.companies c
where not exists (
  select 1
  from public.warehouses w
  where w.tenant_id = c.tenant_id
    and w.company_id = c.id
);

alter table public.item_balance_entries
  add column warehouse_id uuid,
  add column warehouse_code varchar(100),
  add column warehouse_description text;

update public.item_balance_entries ibe
set
  warehouse_id = w.id,
  warehouse_code = w.code,
  warehouse_description = w.description,
  updated_at = now()
from public.warehouses w
where ibe.warehouse_id is null
  and w.tenant_id = ibe.tenant_id
  and w.company_id = ibe.company_id
  and w.is_default = true;

alter table public.item_balance_entries
  alter column warehouse_id set not null,
  alter column warehouse_code set not null;

alter table public.item_balance_entries
  add constraint item_balance_entries_warehouse_id_fkey
  foreign key (warehouse_id)
  references public.warehouses(id)
  on delete restrict;

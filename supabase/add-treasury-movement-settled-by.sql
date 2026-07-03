begin;

alter table public.treasury_general_movements
add column if not exists settled_by_member_id uuid
references public.treasury_members(id) on delete set null;

create index if not exists treasury_general_movements_settled_by_member_idx
on public.treasury_general_movements(settled_by_member_id);

drop policy if exists treasury_general_movements_company_insert
on public.treasury_general_movements;

create policy treasury_general_movements_company_insert
on public.treasury_general_movements
for insert
to authenticated
with check (
  public.is_company_member(tenant_id, company_id)
  and exists (
    select 1
    from public.chart_of_accounts coa
    where coa.id = account_id
      and coa.tenant_id = treasury_general_movements.tenant_id
      and coa.company_id = treasury_general_movements.company_id
      and coa.is_heading = false
      and (
        (
          treasury_type in ('Gastos Reales', 'Gastos Previstos')
          and coa.account_group = 'expenses'
        )
        or
        (
          treasury_type in ('Ingresos Reales', 'Ingresos Previstos')
          and coa.account_group = 'income'
        )
      )
  )
  and exists (
    select 1
    from public.treasury_members tm
    where tm.id = paid_by_member_id
      and tm.tenant_id = treasury_general_movements.tenant_id
      and tm.company_id = treasury_general_movements.company_id
  )
  and (
    settled_by_member_id is null
    or exists (
      select 1
      from public.treasury_members settled_tm
      where settled_tm.id = settled_by_member_id
        and settled_tm.tenant_id = treasury_general_movements.tenant_id
        and settled_tm.company_id = treasury_general_movements.company_id
    )
  )
);

drop policy if exists treasury_general_movements_company_update
on public.treasury_general_movements;

create policy treasury_general_movements_company_update
on public.treasury_general_movements
for update
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (
  public.is_company_member(tenant_id, company_id)
  and exists (
    select 1
    from public.chart_of_accounts coa
    where coa.id = account_id
      and coa.tenant_id = treasury_general_movements.tenant_id
      and coa.company_id = treasury_general_movements.company_id
      and coa.is_heading = false
      and (
        (
          treasury_type in ('Gastos Reales', 'Gastos Previstos')
          and coa.account_group = 'expenses'
        )
        or
        (
          treasury_type in ('Ingresos Reales', 'Ingresos Previstos')
          and coa.account_group = 'income'
        )
      )
  )
  and exists (
    select 1
    from public.treasury_members tm
    where tm.id = paid_by_member_id
      and tm.tenant_id = treasury_general_movements.tenant_id
      and tm.company_id = treasury_general_movements.company_id
  )
  and (
    settled_by_member_id is null
    or exists (
      select 1
      from public.treasury_members settled_tm
      where settled_tm.id = settled_by_member_id
        and settled_tm.tenant_id = treasury_general_movements.tenant_id
        and settled_tm.company_id = treasury_general_movements.company_id
    )
  )
);

notify pgrst, 'reload schema';

commit;

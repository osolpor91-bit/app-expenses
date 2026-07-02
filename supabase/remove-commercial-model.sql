-- Remove the product/plan/subscription model and platform-level administrators.
-- Run this script in the Supabase SQL Editor after deploying the matching code.

drop policy if exists tenants_member_access on public.tenants;
create policy tenants_member_access
on public.tenants
for select
to authenticated
using (public.is_tenant_member(id));

drop policy if exists tenant_users_member_access on public.tenant_users;
drop policy if exists tenant_users_own_read on public.tenant_users;
create policy tenant_users_own_read
on public.tenant_users
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists companies_tenant_access on public.companies;
create policy companies_tenant_access
on public.companies
for all
to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

drop policy if exists countries_tenant_access on public.countries;
create policy countries_tenant_access
on public.countries
for all
to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

drop policy if exists fiscal_treatments_company_access on public.fiscal_treatments;
create policy fiscal_treatments_company_access
on public.fiscal_treatments
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists tax_areas_company_access on public.tax_areas;
create policy tax_areas_company_access
on public.tax_areas
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists chart_of_accounts_company_access on public.chart_of_accounts;
create policy chart_of_accounts_company_access
on public.chart_of_accounts
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists payment_channels_company_access on public.payment_channels;
create policy payment_channels_company_access
on public.payment_channels
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists tax_configurations_company_access on public.tax_configurations;
create policy tax_configurations_company_access
on public.tax_configurations
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists email_configurations_company_access on public.email_configurations;
create policy email_configurations_company_access
on public.email_configurations
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop policy if exists email_send_logs_company_access on public.email_send_logs;
create policy email_send_logs_company_access
on public.email_send_logs
for all
to authenticated
using (public.is_company_member(tenant_id, company_id))
with check (public.is_company_member(tenant_id, company_id));

drop table if exists public.tenant_products;
drop table if exists public.subscriptions;
drop table if exists public.plan_products;
drop table if exists public.plans;
drop table if exists public.products;

drop function if exists public.is_platform_admin();
drop table if exists public.platform_admin_users;

import { cache } from "react";
import { cookies } from "next/headers";

import { requireTenant } from "@/lib/auth/requireTenant";
import {
  listCompaniesForTenant,
  type CompanyContextRow,
} from "@/lib/repositories/companiesRepository";

export const activeCompanyCookieName = "active_company_id";

export type CurrentCompany = CompanyContextRow;

async function requireCompanyContextImpl() {
  const tenantContext = await requireTenant();
  const { supabase, tenant } = tenantContext;

  const { data: companiesData, error: companiesError } =
    await listCompaniesForTenant({
      supabase,
      tenantId: tenant.id,
    });

  if (companiesError) {
    throw new Error(`Error leyendo empresas: ${companiesError.message}`);
  }

  const companies = (companiesData ?? []) as CurrentCompany[];

  const cookieStore = await cookies();
  const activeCompanyId =
    cookieStore.get(activeCompanyCookieName)?.value ?? null;

  const activeCompany =
    companies.find((company) => company.id === activeCompanyId) ??
    companies[0] ??
    null;

  return {
    ...tenantContext,
    companies,
    activeCompany,
  };
}

export const requireCompanyContext = cache(requireCompanyContextImpl);
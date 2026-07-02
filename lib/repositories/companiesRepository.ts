import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type CompanyContextRow = {
  id: string;
  tenant_id: string;
  name: string;
  tax_id?: string | null;
  currency_code?: string | null;
  purchase_default_line_type?: string | null;
};

export async function listCompaniesForTenant({
  supabase,
  tenantId,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
}) {
  return supabase
    .from("companies")
    .select("id, tenant_id, name, tax_id, currency_code, purchase_default_line_type")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });
}

export async function getCompanyIdForTenant({
  supabase,
  tenantId,
  companyId,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  companyId: string;
}) {
  return supabase
    .from("companies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", companyId)
    .maybeSingle();
}
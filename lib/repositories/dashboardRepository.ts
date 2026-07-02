import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type TenantCountTable = "companies" | "countries";
type CompanyCountTable = "suppliers";

export async function countTenantRows({
  supabase,
  tableName,
  tenantId,
}: {
  supabase: SupabaseServerClient;
  tableName: TenantCountTable;
  tenantId: string;
}): Promise<number> {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function countCompanyRows({
  supabase,
  tableName,
  tenantId,
  companyId,
}: {
  supabase: SupabaseServerClient;
  tableName: CompanyCountTable;
  tenantId: string;
  companyId: string | null | undefined;
}): Promise<number> {
  if (!companyId) {
    return 0;
  }

  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("company_id", companyId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
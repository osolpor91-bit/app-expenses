import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type TenantRelationRow = {
  id: string;
  name: string;
  slug: string;
};

export type ActiveTenantUserWithTenantRow = {
  tenant_id: string;
  role: string;
  tenants: TenantRelationRow | TenantRelationRow[] | null;
};

export async function getActiveTenantUserWithTenant({
  supabase,
  userId,
}: {
  supabase: SupabaseServerClient;
  userId: string;
}) {
  return supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
}
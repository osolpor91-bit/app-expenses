import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type ProductRelationRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type ActiveTenantProductWithProductRow = {
  status: string;
  products: ProductRelationRow | ProductRelationRow[] | null;
};

export type RequiredTenantProductWithProductRow = {
  product_id: string;
  status: string;
  products: ProductRelationRow | ProductRelationRow[] | null;
};

export async function listActiveTenantProductsWithProduct({
  supabase,
  tenantId,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
}) {
  return supabase
    .from("tenant_products")
    .select(
      `
      status,
      products!inner (
        id,
        code,
        name,
        description
      )
    `
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
}

export async function getActiveTenantProductByProductCode({
  supabase,
  tenantId,
  productCode,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  productCode: string;
}) {
  return supabase
    .from("tenant_products")
    .select("product_id, status, products!inner(id, code, name)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("products.code", productCode)
    .limit(1)
    .maybeSingle();
}
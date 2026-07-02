import {
  listActiveTenantProductsWithProduct,
  type ActiveTenantProductWithProductRow,
  type ProductRelationRow,
} from "@/lib/repositories/tenantProductsRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type ActiveTenantProduct = {
  productId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
};

function normalizeProduct(
  product: ProductRelationRow | ProductRelationRow[] | null
): ProductRelationRow | null {
  if (Array.isArray(product)) {
    return product[0] ?? null;
  }

  return product;
}

export async function getTenantProducts(
  supabase: SupabaseServerClient,
  tenantId: string
): Promise<ActiveTenantProduct[]> {
  const { data, error } = await listActiveTenantProductsWithProduct({
    supabase,
    tenantId,
  });

  if (error) {
    throw new Error(`Error leyendo productos activos: ${error.message}`);
  }

  return ((data ?? []) as ActiveTenantProductWithProductRow[])
    .map((row) => {
      const product = normalizeProduct(row.products);

      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        code: product.code,
        name: product.name,
        description: product.description ?? null,
        status: row.status,
      };
    })
    .filter((product): product is ActiveTenantProduct => product !== null);
}
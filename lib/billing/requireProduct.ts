import { getIsPlatformAdmin } from "@/lib/auth/getIsPlatformAdmin";
import { getProductByCode } from "@/lib/repositories/productsRepository";
import {
  getActiveTenantProductByProductCode,
  type ProductRelationRow,
  type RequiredTenantProductWithProductRow,
} from "@/lib/repositories/tenantProductsRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type RequiredProduct = {
  productId: string;
  productCode: string;
  productName: string;
};

function normalizeProduct(
  product: ProductRelationRow | ProductRelationRow[] | null | undefined
): ProductRelationRow | null {
  if (Array.isArray(product)) {
    return product[0] ?? null;
  }

  return product ?? null;
}

export async function requireProduct(
  supabase: SupabaseServerClient,
  tenantId: string,
  productCode: string
): Promise<RequiredProduct> {
  const { data: tenantProductData, error: tenantProductError } =
    await getActiveTenantProductByProductCode({
      supabase,
      tenantId,
      productCode,
    });

  if (tenantProductError) {
    throw new Error(
      `Error comprobando producto activo: ${tenantProductError.message}`
    );
  }

  const tenantProduct =
    tenantProductData as RequiredTenantProductWithProductRow | null;

  const activeProduct = normalizeProduct(tenantProduct?.products);

  if (activeProduct?.id && activeProduct.code && activeProduct.name) {
    return {
      productId: activeProduct.id,
      productCode: activeProduct.code,
      productName: activeProduct.name,
    };
  }

  const isPlatformAdmin = await getIsPlatformAdmin(supabase);

  if (isPlatformAdmin) {
    const { data: product, error: productError } = await getProductByCode({
      supabase,
      productCode,
    });

    if (productError) {
      throw new Error(`Error leyendo producto: ${productError.message}`);
    }

    if (product) {
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
      };
    }
  }

  throw new Error(`Este tenant no tiene activo el producto "${productCode}".`);
}
import {
  listProductsOrderedByName,
  type ProductRow,
} from "@/lib/repositories/productsRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type ProductForNavigation = {
  productId: string;
  code: string;
  name: string;
  description: string | null;
};

export async function getAllProducts(
  supabase: SupabaseServerClient
): Promise<ProductForNavigation[]> {
  const { data, error } = await listProductsOrderedByName({ supabase });

  if (error) {
    throw new Error(`Error leyendo productos: ${error.message}`);
  }

  return ((data ?? []) as ProductRow[]).map((product) => ({
    productId: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
  }));
}
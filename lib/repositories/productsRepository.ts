import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type ProductForRequirementRow = {
  id: string;
  code: string;
  name: string;
};

export async function listProductsOrderedByName({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("products")
    .select("id, code, name, description")
    .order("name", { ascending: true });
}

export async function getProductByCode({
  supabase,
  productCode,
}: {
  supabase: SupabaseServerClient;
  productCode: string;
}) {
  return supabase
    .from("products")
    .select("id, code, name")
    .eq("code", productCode)
    .limit(1)
    .maybeSingle();
}
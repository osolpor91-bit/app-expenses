import type { EntityRelationOption } from "@/lib/entities/core/entityRelations";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";

export type PurchaseLineSourceType = "item" | "account";

export type PurchaseLineSourceOptionsByType = Record<
  PurchaseLineSourceType,
  EntityRelationOption[]
>;

type PurchaseLineSourceRow = {
  id: string;
  code: string | null;
  description: string | null;
  fiscal_treatment_id: string | null;
  purchase_price?: string | number | null;
};

function formatSourceLabel(row: PurchaseLineSourceRow) {
  return String(row.code ?? "").trim();
}

function mapSourceRows(rows: PurchaseLineSourceRow[] | null | undefined) {
  return (rows ?? []).reduce<EntityRelationOption[]>((options, row) => {
    const id = String(row.id ?? "").trim();
    const label = formatSourceLabel(row);

    if (!id || !label) {
      return options;
    }

    options.push({
      id,
      label,
      values: {
        code: row.code,
        description: row.description,
        fiscal_treatment_id: row.fiscal_treatment_id,
        purchase_price: row.purchase_price ?? null,
      },
    });

    return options;
  }, []);
}

export async function loadPurchaseLineSourceOptions({
  supabase,
  context,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
}): Promise<PurchaseLineSourceOptionsByType> {
  if (!context.companyId) {
    return {
      item: [],
      account: [],
    };
  }

  const [itemsResult, accountsResult] = await Promise.all([
    supabase
      .from("items")
      .select("id, code, description, fiscal_treatment_id, purchase_price")
      .eq("tenant_id", context.tenantId)
      .eq("company_id", context.companyId)
      .eq("is_active", true)
      .order("code", { ascending: true }),

    supabase
      .from("chart_of_accounts")
      .select("id, code, description, fiscal_treatment_id")
      .eq("tenant_id", context.tenantId)
      .eq("company_id", context.companyId)
      .eq("is_heading", false)
      .order("code", { ascending: true }),
  ]);

  return {
    item: mapSourceRows(itemsResult.data),
    account: mapSourceRows(accountsResult.data),
  };
}

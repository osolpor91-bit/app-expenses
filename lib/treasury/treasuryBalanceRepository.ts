import type { SupabaseServerClient } from "@/lib/entities/core/entityRepository";

import type { TreasuryBalanceMovement } from "./treasuryBalance";

const balancePageSize = 1000;

export async function listTreasuryBalanceMovements({
  supabase,
  tenantId,
  companyId,
  dateFrom,
  dateTo,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  companyId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TreasuryBalanceMovement[]> {
  const movements: TreasuryBalanceMovement[] = [];

  for (let page = 0; ; page += 1) {
    let query = supabase
      .from("treasury_general_movements")
      .select(
        "id, account_id, account_no, account_description, treasury_type, amount, movement_date, entry_description, is_expense_closed, treasury_members:paid_by_member_id(id, first_name, last_name)"
      )
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .order("id", { ascending: true })
      .range(
        page * balancePageSize,
        page * balancePageSize + balancePageSize - 1
      );

    if (dateFrom) {
      query = query.gte("movement_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("movement_date", dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const pageMovements = data ?? [];
    movements.push(...pageMovements);

    if (pageMovements.length < balancePageSize) {
      break;
    }
  }

  return movements;
}

import type { SupabaseServerClient } from "@/lib/entities/core/entityRepository";

import type { TreasurySettlementMovement } from "./treasurySettlements";

const settlementPageSize = 1000;

function toMovement(
  value: Record<string, unknown>
): TreasurySettlementMovement | null {
  const id = String(value.id ?? "").trim();
  const paidByMemberId = String(value.paid_by_member_id ?? "").trim();
  const amount = Number(value.amount);

  if (!id || !paidByMemberId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id,
    movementDate: String(value.movement_date ?? "").trim(),
    accountDescription: String(value.account_description ?? "").trim(),
    comment: String(value.entry_description ?? "").trim(),
    amount,
    paidByMemberId,
    settledByMemberId: String(value.settled_by_member_id ?? "").trim(),
  };
}

export async function listTreasurySettlementMovements({
  supabase,
  tenantId,
  companyId,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  companyId: string;
}): Promise<TreasurySettlementMovement[]> {
  const movements: TreasurySettlementMovement[] = [];

  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("treasury_general_movements")
      .select(
        "id, movement_date, account_description, entry_description, amount, paid_by_member_id, settled_by_member_id"
      )
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .eq("treasury_type", "Gastos Reales")
      .order("movement_date", { ascending: false })
      .order("id", { ascending: true })
      .range(
        page * settlementPageSize,
        page * settlementPageSize + settlementPageSize - 1
      );

    if (error) {
      throw new Error(error.message);
    }

    const pageMovements = (data ?? []).reduce<TreasurySettlementMovement[]>(
      (result, movement) => {
        const parsedMovement = toMovement(
          movement as Record<string, unknown>
        );

        if (parsedMovement) {
          result.push(parsedMovement);
        }

        return result;
      },
      []
    );

    movements.push(...pageMovements);

    if ((data ?? []).length < settlementPageSize) {
      break;
    }
  }

  return movements;
}

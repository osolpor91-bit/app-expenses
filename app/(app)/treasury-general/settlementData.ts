import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { listTreasurySettlementMovements } from "@/lib/treasury/treasurySettlementRepository";
import {
  buildPendingTreasurySettlementGroups,
  type PendingTreasurySettlementGroup,
  type TreasurySettlementMember,
} from "@/lib/treasury/treasurySettlements";

import type { TreasuryMemberOption } from "./TreasuryMovementModal";

export type TreasurySettlementViewData = {
  hasActiveCompany: boolean;
  defaultMemberId: string;
  defaultMemberName: string;
  memberOptions: TreasuryMemberOption[];
  groups: PendingTreasurySettlementGroup[];
};

export async function loadTreasurySettlementViewData(): Promise<TreasurySettlementViewData> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return {
      hasActiveCompany: false,
      defaultMemberId: "",
      defaultMemberName: "",
      memberOptions: [],
      groups: [],
    };
  }

  const [membersResult, movements] = await Promise.all([
    supabase
      .from("treasury_members")
      .select("id, first_name, last_name, is_default")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("is_default", { ascending: false })
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true }),
    listTreasurySettlementMovements({
      supabase,
      tenantId: tenant.id,
      companyId: activeCompany.id,
    }),
  ]);

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }

  const members = (membersResult.data ?? []).reduce<
    TreasurySettlementMember[]
  >((result, member) => {
    const id = String(member.id ?? "").trim();
    const name = [member.first_name, member.last_name]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(" ");

    if (!id || !name) {
      return result;
    }

    result.push({
      id,
      name,
      isDefault: Boolean(member.is_default),
    });

    return result;
  }, []);
  const defaultMember = members.find((member) => member.isDefault) ?? null;
  const defaultMemberId = defaultMember?.id ?? "";

  return {
    hasActiveCompany: true,
    defaultMemberId,
    defaultMemberName: defaultMember?.name ?? "",
    memberOptions: members.map((member) => ({
      value: member.id,
      label: member.name,
      menuLabel: member.name,
      searchLabel: member.name,
    })),
    groups: buildPendingTreasurySettlementGroups({
      movements,
      members,
      defaultMemberId,
    }),
  };
}

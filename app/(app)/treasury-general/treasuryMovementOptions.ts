import { requireCompanyContext } from "@/lib/company/requireCompanyContext";

import type {
  TreasuryAccountOption,
  TreasuryMemberOption,
} from "./TreasuryMovementModal";

export type TreasuryMovementOptions = {
  accountOptions: TreasuryAccountOption[];
  memberOptions: TreasuryMemberOption[];
  defaultMemberId: string;
};

export async function loadTreasuryMovementOptions(): Promise<TreasuryMovementOptions> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return {
      accountOptions: [],
      memberOptions: [],
      defaultMemberId: "",
    };
  }

  const [accountsResult, membersResult] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("id, code, description, account_group")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .eq("is_heading", false)
      .in("account_group", ["expenses", "income"])
      .order("description", { ascending: true }),
    supabase
      .from("treasury_members")
      .select("id, first_name, last_name, is_default")
      .eq("tenant_id", tenant.id)
      .eq("company_id", activeCompany.id)
      .order("is_default", { ascending: false })
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true }),
  ]);

  if (accountsResult.error) {
    throw new Error(
      `Error leyendo cuentas contables: ${accountsResult.error.message}`
    );
  }

  if (membersResult.error) {
    throw new Error(`Error leyendo miembros: ${membersResult.error.message}`);
  }

  const accountOptions = (accountsResult.data ?? []).reduce<
    TreasuryAccountOption[]
  >((options, account) => {
    const value = String(account.id ?? "").trim();
    const code = String(account.code ?? "").trim();
    const description = String(account.description ?? "").trim();
    const accountGroup = String(account.account_group ?? "").trim();

    if (
      !value ||
      !code ||
      !description ||
      !["expenses", "income"].includes(accountGroup)
    ) {
      return options;
    }

    options.push({
      value,
      label: description,
      menuLabel: description,
      searchLabel: `${code} ${description}`,
      accountGroup: accountGroup as TreasuryAccountOption["accountGroup"],
    });

    return options;
  }, []);

  const memberOptions = (membersResult.data ?? []).reduce<
    TreasuryMemberOption[]
  >((options, member) => {
    const value = String(member.id ?? "").trim();
    const label = [member.first_name, member.last_name]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(" ");

    if (!value || !label) {
      return options;
    }

    options.push({
      value,
      label,
      menuLabel: label,
      searchLabel: label,
    });

    return options;
  }, []);

  const defaultMemberId = String(
    membersResult.data?.find((member) => member.is_default)?.id ?? ""
  ).trim();

  return {
    accountOptions,
    memberOptions,
    defaultMemberId,
  };
}

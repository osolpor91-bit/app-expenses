export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  getRelatedDisplayName,
  type RelatedRecord,
} from "@/lib/admin/tableRows";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { getDictionary } from "@/lib/i18n/server";
import { listAdminPlanProducts } from "@/lib/repositories/adminTablesRepository";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

type PlanProductRow = {
  plan: RelatedRecord;
  product: RelatedRecord;
};

export default async function AdminPlanProductsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { dict } = await getDictionary();

  const { data, error } = await listAdminPlanProducts({ supabase });

  if (error) {
    throw new Error(
      `${dict.adminTables.errorReading.replace(
        "{table}",
        dict.admin.planProducts
      )}: ${error.message}`
    );
  }

  const rows = ((data ?? []) as unknown as PlanProductRow[]).map((row) => ({
    plan: getRelatedDisplayName(row.plan, ["code", "name"]),
    product: getRelatedDisplayName(row.product, ["code", "name"]),
  }));

  return (
    <AdminTablePage
      title={dict.admin.planProducts}
      rows={rows as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={["plan", "product"]}
    />
  );
}
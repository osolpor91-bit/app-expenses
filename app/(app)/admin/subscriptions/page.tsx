export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import {
  getRelatedDisplayName,
  getRelatedRecord,
  matchesSearchValues,
  type RelatedRecord,
} from "@/lib/admin/tableRows";
import { getDictionary } from "@/lib/i18n/server";
import { listAdminSubscriptions } from "@/lib/repositories/adminTablesRepository";
import { getSingleSearchParam } from "@/lib/search/textSearch";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

type AdminSubscriptionsPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

type SubscriptionRow = {
  id?: string | null;
  tenant_id?: string | null;
  plan_id?: string | null;
  status?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at?: string | null;
  tenant: RelatedRecord;
  plan: RelatedRecord;
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: AdminSubscriptionsPageProps) {
  const { supabase } = await requirePlatformAdmin();
  const { dict } = await getDictionary();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSingleSearchParam(resolvedSearchParams.search);

  const { data, error } = await listAdminSubscriptions({ supabase });

  if (error) {
    throw new Error(
      `${dict.adminTables.errorReading.replace(
        "{table}",
        dict.admin.subscriptions
      )}: ${error.message}`
    );
  }

  const rows = ((data ?? []) as unknown as SubscriptionRow[])
    .filter((row) => {
      const tenant = getRelatedRecord(row.tenant);
      const plan = getRelatedRecord(row.plan);

      return matchesSearchValues(
        search,
        [row.status, tenant?.name, tenant?.slug, plan?.code, plan?.name],
        [row.id, row.tenant_id, row.plan_id]
      );
    })
    .map((row) => ({
      tenant: getRelatedDisplayName(row.tenant, ["name", "slug"], row.tenant_id),
      plan: getRelatedDisplayName(row.plan, ["code", "name"], row.plan_id),
      status: row.status,
      current_period_start: row.current_period_start,
      current_period_end: row.current_period_end,
      created_at: row.created_at,
      tenant_id: row.tenant_id,
      plan_id: row.plan_id,
      id: row.id,
    }));

  return (
    <AdminTablePage
      title={dict.admin.subscriptions}
      rows={rows as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={[
        "tenant",
        "plan",
        "status",
        "current_period_start",
        "current_period_end",
        "created_at",
      ]}
      hiddenColumns={["id", "tenant_id", "plan_id"]}
      searchValue={search}
    />
  );
}
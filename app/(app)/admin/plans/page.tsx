export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { getDictionary } from "@/lib/i18n/server";
import { listAdminPlans } from "@/lib/repositories/adminTablesRepository";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

export default async function AdminPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { dict } = await getDictionary();

  const { data, error } = await listAdminPlans({ supabase });

  if (error) {
    throw new Error(
      `${dict.adminTables.errorReading.replace(
        "{table}",
        dict.admin.plans
      )}: ${error.message}`
    );
  }

  return (
    <AdminTablePage
      title={dict.admin.plans}
      rows={(data ?? []) as unknown as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={[
        "code",
        "name",
        "description",
        "active",
        "status",
        "created_at",
        "updated_at",
      ]}
      hiddenColumns={["id"]}
    />
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { buildAuthUserMap, listAllAuthUsers } from "@/lib/admin/authUsers";
import {
  getRelatedDisplayName,
  includesSearch,
  type RelatedRecord,
} from "@/lib/admin/tableRows";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { getDictionary } from "@/lib/i18n/server";
import { listAdminTenantUsersWithTenants } from "@/lib/repositories/adminTablesRepository";
import { getSingleSearchParam } from "@/lib/search/textSearch";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

type TenantUsersPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

type TenantUserRecord = {
  user_id: string;
  tenant_id: string;
  role: string | null;
  status: string | null;
  tenants: RelatedRecord;
};

export default async function TenantUsersPage({
  searchParams,
}: TenantUsersPageProps) {
  await requirePlatformAdmin();

  const { dict } = await getDictionary();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSingleSearchParam(resolvedSearchParams.search);

  const [authUsers, { data, error }] = await Promise.all([
    listAllAuthUsers(),
    listAdminTenantUsersWithTenants(),
  ]);

  if (error) {
    throw new Error(`${dict.admin.errorReadingTenantUsers}: ${error.message}`);
  }

  const authUserMap = buildAuthUserMap(authUsers);

  const rows = ((data ?? []) as unknown as TenantUserRecord[])
    .map((record) => ({
      tenant: getRelatedDisplayName(record.tenants, ["name", "slug"]),
      email: authUserMap.get(record.user_id)?.email ?? "",
      user_id: record.user_id,
      role: record.role,
      status: record.status,
      tenant_id: record.tenant_id,
    }))
    .filter((row) => {
      if (!search) {
        return true;
      }

      return (
        includesSearch(row.tenant, search) ||
        includesSearch(row.email, search) ||
        includesSearch(row.user_id, search) ||
        includesSearch(row.role, search) ||
        includesSearch(row.status, search)
      );
    })
    .sort((a, b) => {
      const tenantCompare = String(a.tenant).localeCompare(String(b.tenant));

      if (tenantCompare !== 0) {
        return tenantCompare;
      }

      return String(a.email).localeCompare(String(b.email));
    });

  return (
    <AdminTablePage
      title={dict.admin.tenantUsers}
      description={dict.admin.tenantUsersDescription}
      rows={rows as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={["tenant", "email", "user_id", "role", "status"]}
      hiddenColumns={["tenant_id"]}
      searchValue={search}
      searchPlaceholder={dict.admin.searchUsersPlaceholder}
      emptyLabel={dict.admin.noTenantUsers}
      columnLabels={{
        ...dict.adminTables.columns,
        tenant: dict.admin.tenant,
        email: dict.admin.email,
        user_id: dict.admin.userId,
        role: dict.admin.role,
        status: dict.admin.status,
      }}
    />
  );
}
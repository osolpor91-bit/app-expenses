export const dynamic = "force-dynamic";
export const revalidate = 0;

import { matchesSearchValues } from "@/lib/admin/tableRows";
import { requireTenantPageAccess } from "@/lib/auth/requireTenantPageAccess";
import { getDictionary } from "@/lib/i18n/server";
import { listAdminTenants } from "@/lib/repositories/adminTablesRepository";
import { getSingleSearchParam } from "@/lib/search/textSearch";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

type AdminTenantsPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

type TenantRow = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default async function AdminTenantsPage({
  searchParams,
}: AdminTenantsPageProps) {
  await requireTenantPageAccess("admin");
  const { dict } = await getDictionary();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSingleSearchParam(resolvedSearchParams.search);

  const { data, error } = await listAdminTenants();

  if (error) {
    throw new Error(
      `${dict.adminTables.errorReading.replace(
        "{table}",
        dict.admin.tenants
      )}: ${error.message}`
    );
  }

  const rows = ((data ?? []) as TenantRow[])
    .filter((row) =>
      matchesSearchValues(search, [row.name, row.slug, row.status], [row.id])
    )
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      status: row.status,
      created_at: row.created_at,
      id: row.id,
    }));

  return (
    <AdminTablePage
      title={dict.admin.tenants}
      rows={rows as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={["name", "slug", "status", "created_at"]}
      hiddenColumns={["id"]}
      searchValue={search}
    />
  );
}

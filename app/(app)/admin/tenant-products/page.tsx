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
import { listAdminTenantProducts } from "@/lib/repositories/adminTablesRepository";
import { getSingleSearchParam } from "@/lib/search/textSearch";

import AdminTablePage from "../components/AdminTablePage";
import type { AdminReadOnlyRecord } from "../components/AdminReadOnlyTable";

type AdminTenantProductsPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

type TenantProductRow = {
  id?: string | null;
  tenant_id?: string | null;
  product_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  tenant: RelatedRecord;
  product: RelatedRecord;
};

export default async function AdminTenantProductsPage({
  searchParams,
}: AdminTenantProductsPageProps) {
  const { supabase } = await requirePlatformAdmin();
  const { dict } = await getDictionary();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSingleSearchParam(resolvedSearchParams.search);

  const { data, error } = await listAdminTenantProducts({ supabase });

  if (error) {
    throw new Error(
      `${dict.adminTables.errorReading.replace(
        "{table}",
        dict.admin.tenantProducts
      )}: ${error.message}`
    );
  }

  const rows = ((data ?? []) as unknown as TenantProductRow[])
    .filter((row) => {
      const tenant = getRelatedRecord(row.tenant);
      const product = getRelatedRecord(row.product);

      return matchesSearchValues(
        search,
        [row.status, tenant?.name, tenant?.slug, product?.code, product?.name],
        [row.id, row.tenant_id, row.product_id]
      );
    })
    .map((row) => ({
      tenant: getRelatedDisplayName(row.tenant, ["name", "slug"], row.tenant_id),
      product: getRelatedDisplayName(
        row.product,
        ["code", "name"],
        row.product_id
      ),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tenant_id: row.tenant_id,
      product_id: row.product_id,
      id: row.id,
    }));

  return (
    <AdminTablePage
      title={dict.admin.tenantProducts}
      rows={rows as AdminReadOnlyRecord[]}
      commonLabels={dict.common}
      adminTableLabels={dict.adminTables}
      preferredColumns={[
        "tenant",
        "product",
        "status",
        "created_at",
        "updated_at",
      ]}
      hiddenColumns={["id", "tenant_id", "product_id"]}
      searchValue={search}
    />
  );
}
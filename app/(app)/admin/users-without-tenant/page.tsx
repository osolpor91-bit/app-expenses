export const dynamic = "force-dynamic";
export const revalidate = 0;

import { listAllAuthUsers } from "@/lib/admin/authUsers";
import { requireTenantPageAccess } from "@/lib/auth/requireTenantPageAccess";
import { getDictionary } from "@/lib/i18n/server";
import {
  listActiveTenantUserIdsForAdmin,
  listAdminTenantOptionsForAssignment,
} from "@/lib/repositories/adminTablesRepository";
import { getFilterValues } from "@/lib/search/databaseFilters";
import { getSingleSearchParam } from "@/lib/search/textSearch";

import FilterBar from "../../components/FilterBar";
import { assignTenantToUserAction } from "./actions";

type UsersWithoutTenantPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
    assigned?: string | string[];
  }>;
};

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
};

type TenantUserIdRecord = {
  user_id: string;
};

function includesSearch(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function UsersWithoutTenantPage({
  searchParams,
}: UsersWithoutTenantPageProps) {
  await requireTenantPageAccess("admin");

  const { dict } = await getDictionary();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSingleSearchParam(resolvedSearchParams.search);
  const assigned = getSingleSearchParam(resolvedSearchParams.assigned);

  const filterValues = getFilterValues(resolvedSearchParams, ["search"]);

  const [
    authUsers,
    { data: activeTenantUsers, error: activeTenantUsersError },
    { data: tenants, error: tenantsError },
  ] = await Promise.all([
    listAllAuthUsers(),
    listActiveTenantUserIdsForAdmin(),
    listAdminTenantOptionsForAssignment(),
  ]);

  if (activeTenantUsersError) {
    throw new Error(
      `${dict.admin.errorReadingTenantUsers}: ${activeTenantUsersError.message}`
    );
  }

  if (tenantsError) {
    throw new Error(`${dict.admin.errorReadingTenants}: ${tenantsError.message}`);
  }

  const activeTenantUserIds = new Set(
    ((activeTenantUsers ?? []) as TenantUserIdRecord[]).map(
      (tenantUser) => tenantUser.user_id
    )
  );

  const usersWithoutTenant = authUsers
    .filter((user) => !activeTenantUserIds.has(user.id))
    .filter((user) => {
      if (!search) {
        return true;
      }

      return includesSearch(user.id, search) || includesSearch(user.email, search);
    })
    .sort((a, b) => String(a.email ?? "").localeCompare(String(b.email ?? "")));

  const tenantOptions = (tenants ?? []) as TenantRecord[];

  return (
    <section>
      <div>
        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {dict.admin.usersWithoutTenant}
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-app-muted">
          {dict.admin.usersWithoutTenantDescription}
        </p>
      </div>

      {assigned === "1" && (
        <div className="mt-5 rounded-lg border border-app bg-app-soft px-4 py-3 text-sm text-app-muted">
          {dict.admin.userAssignedToTenant}
        </div>
      )}

      <div className="mt-6">
        <FilterBar
          initialValues={filterValues}
          labels={{
            apply: dict.common.applyFilters,
            clear: dict.common.clearFilters,
            filters: dict.common.filters,
            hideFilters: dict.common.hideFilters,
          }}
          primaryFields={[
            {
              type: "text",
              name: "search",
              label: dict.common.search,
              placeholder: dict.admin.searchUsersPlaceholder,
            },
          ]}
          secondaryFields={[]}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-app">
        <table className="table-app min-w-[1100px] text-xs sm:text-sm">
          <thead className="table-head-app">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">
                {dict.admin.email}
              </th>

              <th className="px-3 py-2 text-left font-semibold">
                {dict.admin.userId}
              </th>

              <th className="px-3 py-2 text-left font-semibold">
                {dict.admin.createdAt}
              </th>

              <th className="px-3 py-2 text-left font-semibold">
                {dict.admin.lastSignInAt}
              </th>

              <th className="px-3 py-2 text-left font-semibold">
                {dict.admin.assignTenant}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)] bg-app">
            {usersWithoutTenant.map((user) => (
              <tr key={user.id} className="table-row-app">
                <td className="px-3 py-2 font-medium text-primary-app">
                  {user.email ?? "-"}
                </td>

                <td className="px-3 py-2 font-mono text-xs text-app-muted">
                  {user.id}
                </td>

                <td className="px-3 py-2 text-app-muted">
                  {formatDate(user.created_at)}
                </td>

                <td className="px-3 py-2 text-app-muted">
                  {formatDate(user.last_sign_in_at)}
                </td>

                <td className="px-3 py-2">
                  <form
                    action={assignTenantToUserAction}
                    className="flex min-w-[420px] items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={user.id} />

                    <select
                      name="tenantId"
                      required
                      className="input-app px-3 py-2 text-xs"
                      defaultValue=""
                    >
                      <option value="">{dict.admin.selectTenant}</option>

                      {tenantOptions.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.slug})
                        </option>
                      ))}
                    </select>

                    <select
                      name="role"
                      required
                      className="input-app w-32 px-3 py-2 text-xs"
                      defaultValue="member"
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="readonly">readonly</option>
                    </select>

                    <button
                      type="submit"
                      className="btn-primary-app whitespace-nowrap px-4 py-2 text-xs"
                    >
                      {dict.admin.assign}
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {usersWithoutTenant.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-sm text-app-muted">
                  {dict.admin.noUsersWithoutTenant}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-app-muted">
        {dict.admin.usersWithoutTenantHelpText}
      </p>
    </section>
  );
}

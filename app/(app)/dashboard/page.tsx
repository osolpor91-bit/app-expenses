import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";
import { countCompanyRows } from "@/lib/repositories/dashboardRepository";

export default async function DashboardPage() {
  const { supabase, tenant, role, activeCompany } =
    await requireCompanyContext();
  const { dict } = await getDictionary();

  const suppliersCount = await countCompanyRows({
    supabase,
    tableName: "suppliers",
    tenantId: tenant.id,
    companyId: activeCompany?.id,
  });

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-medium text-app-muted">
          {dict.dashboard.mainMenu}
        </p>

        <h1 className="mt-1 text-2xl font-bold text-[#6b7f22] sm:text-3xl">
          {activeCompany?.name ?? tenant.name}
        </h1>

        <p className="mt-2 text-sm text-app-muted">
          {dict.common.role}: {role}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-primary-app">
          {dict.dashboard.indicators}
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/suppliers"
            className="card-app-soft flex h-36 w-64 flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.nav.suppliers}
            </p>

            <p className="text-4xl font-bold text-primary-app">
              {suppliersCount}
            </p>
          </Link>

          <Link
            href="/suppliers/new"
            className="card-app-soft flex h-36 w-64 flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.newSupplier}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDecimalValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import {
  buildTreasuryBalanceRows,
  getTreasuryBalanceTotals,
} from "@/lib/treasury/treasuryBalance";
import { listTreasuryBalanceMovements } from "@/lib/treasury/treasuryBalanceRepository";

export default async function DashboardPage() {
  const { supabase, tenant, role, activeCompany } =
    await requireCompanyContext();
  const { dict } = await getDictionary();

  const movements = activeCompany
    ? await listTreasuryBalanceMovements({
        supabase,
        tenantId: tenant.id,
        companyId: activeCompany.id,
      })
    : [];
  const balance = getTreasuryBalanceTotals(
    buildTreasuryBalanceRows(movements)
  ).balance;

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
          {dict.dashboard.treasury}
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={{
              pathname: "/treasury-general",
              query: {
                addMovement: "Gastos Reales",
              },
            }}
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.registerExpense}
            </p>
          </Link>

          <Link
            href="/treasury-general/balance"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.totalBalance}
            </p>

            <p
              className={`text-3xl font-bold ${
                balance < 0 ? "text-red-700" : "text-primary-app"
              }`}
            >
              {formatDecimalValue(balance)}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

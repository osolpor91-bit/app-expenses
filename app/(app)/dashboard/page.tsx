import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDecimalValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import {
  buildTreasuryBalanceRows,
  getTreasuryBalanceTotals,
  type TreasuryBalanceMovement,
} from "@/lib/treasury/treasuryBalance";
import { listTreasuryBalanceMovements } from "@/lib/treasury/treasuryBalanceRepository";

export default async function DashboardPage() {
  const { supabase, tenant, activeCompany } =
    await requireCompanyContext();
  const { dict } = await getDictionary();

  let movements: TreasuryBalanceMovement[] = [];
  let membersCount = 0;
  let guestsCount = 0;

  if (activeCompany) {
    const [loadedMovements, membersResult, guestsResult] = await Promise.all([
      listTreasuryBalanceMovements({
        supabase,
        tenantId: tenant.id,
        companyId: activeCompany.id,
      }),
      supabase
        .from("treasury_members")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_guest", false)
        .eq("is_default", false),
      supabase
        .from("treasury_members")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .eq("is_guest", true),
    ]);

    if (membersResult.error) {
      throw new Error(
        `${dict.dashboard.membersReadError}: ${membersResult.error.message}`
      );
    }

    if (guestsResult.error) {
      throw new Error(
        `${dict.dashboard.guestsReadError}: ${guestsResult.error.message}`
      );
    }

    movements = loadedMovements;
    membersCount = membersResult.count ?? 0;
    guestsCount = guestsResult.count ?? 0;
  }

  const balanceTotals = getTreasuryBalanceTotals(
    buildTreasuryBalanceRows(movements)
  );

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#6b7f22] sm:text-3xl">
          {activeCompany?.name ?? tenant.name}
        </h1>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-primary-app">
          {dict.dashboard.treasury}
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/treasury-general"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.treasuryGeneral}
            </p>
          </Link>

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
                balanceTotals.plannedBalance < 0
                  ? "text-red-700"
                  : "text-primary-app"
              }`}
            >
              {formatDecimalValue(balanceTotals.plannedBalance)}
            </p>
          </Link>

          <Link
            href="/treasury-general/balance#real-balance"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.realBalance}
            </p>

            <p
              className={`text-3xl font-bold ${
                balanceTotals.realBalance < 0
                  ? "text-red-700"
                  : "text-primary-app"
              }`}
            >
              {formatDecimalValue(balanceTotals.realBalance)}
            </p>
          </Link>

          <Link
            href="/treasury-general/detailed-balance"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.detailedBalance}
            </p>
          </Link>

          <Link
            href="/reports/income-distribution"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.reports.incomeDistribution}
            </p>
          </Link>

          <Link
            href="/reports/expense-distribution"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.reports.expenseDistribution}
            </p>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-primary-app">
          {dict.dashboard.payments}
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/treasury-general/pending-settlements"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.settlements}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.pendingSettlements}
            </p>
          </Link>

          <Link
            href="/treasury-general/settle-payments"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.dashboard.settlePayments}
            </p>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-primary-app">
          {dict.dashboard.susarros}
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={{
              pathname: "/treasury-members",
              query: {
                isGuest: "false",
                isDefault: "false",
              },
            }}
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.members}
            </p>

            <p className="text-3xl font-bold text-primary-app">
              {membersCount}
            </p>
          </Link>

          <Link
            href={{
              pathname: "/treasury-members",
              query: {
                isGuest: "true",
              },
            }}
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.guests}
            </p>

            <p className="text-3xl font-bold text-primary-app">
              {guestsCount}
            </p>
          </Link>

          <Link
            href="/items"
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.items.title}
            </p>
          </Link>

          <Link
            href={{
              pathname: "/items",
              query: {
                adjustInventory: "true",
              },
            }}
            className="card-app-soft flex h-32 w-full flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
          >
            <p className="text-sm font-medium text-app-muted">
              {dict.dashboard.quickAction}
            </p>

            <p className="text-2xl font-bold text-primary-app">
              {dict.items.bulkInventoryAdjustmentAction}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

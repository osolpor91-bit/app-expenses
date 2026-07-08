export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import FilterBar from "../../components/FilterBar";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDecimalValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import { parseDateRangeFilterValue } from "@/lib/search/dateRangeFilter";
import { getSingleSearchParam } from "@/lib/search/textSearch";
import {
  buildTreasuryBalanceRows,
  getTreasuryBalanceMovementAccountKey,
  type TreasuryBalanceMovement,
} from "@/lib/treasury/treasuryBalance";
import { listTreasuryBalanceMovements } from "@/lib/treasury/treasuryBalanceRepository";

type ExpenseDistributionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ExpenseDistributionRow = {
  accountKey: string;
  accountDescription: string;
  amount: number;
  percentage: number;
  movements: ExpenseDistributionMovement[];
};

type ExpenseDistributionMovement = {
  id: string;
  description: string;
  amount: number;
};

type TreasuryMemberRelation = {
  first_name?: unknown;
};

const barColors = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#be123c",
  "#c2410c",
  "#b91c1c",
  "#a16207",
  "#e11d48",
];

function getAmount(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

function getPaidByMemberName(movement: TreasuryBalanceMovement) {
  const relation = Array.isArray(movement.treasury_members)
    ? movement.treasury_members[0]
    : movement.treasury_members;
  const member = relation as TreasuryMemberRelation | null | undefined;

  if (!member || typeof member !== "object") {
    return "";
  }

  return String(member.first_name ?? "").trim();
}

function getMovementDescription(movement: TreasuryBalanceMovement) {
  const comment = String(movement.entry_description ?? "").trim() || "-";
  const paidBy = getPaidByMemberName(movement);

  return paidBy ? `${comment} (${paidBy})` : comment;
}

function buildExpenseMovementsByAccount({
  movements,
  movementTypeByAccount,
}: {
  movements: TreasuryBalanceMovement[];
  movementTypeByAccount: Map<string, string>;
}) {
  const movementsByAccount = new Map<string, ExpenseDistributionMovement[]>();

  movements.forEach((movement, index) => {
    const accountKey = getTreasuryBalanceMovementAccountKey(movement);
    const movementType = movementTypeByAccount.get(accountKey);

    if (!accountKey || !movementType) {
      return;
    }

    if (String(movement.treasury_type ?? "").trim() !== movementType) {
      return;
    }

    const accountMovements = movementsByAccount.get(accountKey) ?? [];
    accountMovements.push({
      id: String(movement.id ?? index),
      description: getMovementDescription(movement),
      amount: getAmount(movement.amount),
    });
    movementsByAccount.set(accountKey, accountMovements);
  });

  return movementsByAccount;
}

function buildExpenseDistributionRows(
  movements: TreasuryBalanceMovement[]
): ExpenseDistributionRow[] {
  const balanceRows = buildTreasuryBalanceRows(movements);
  const movementTypeByAccount = new Map<string, string>();

  balanceRows.forEach((row) => {
    const accountKey = row.accountId || row.accountNo || row.accountDescription;

    if (!accountKey || row.plannedExpense <= 0) {
      return;
    }

    movementTypeByAccount.set(
      accountKey,
      row.isExpenseClosed || row.realExpense >= row.expectedExpense
        ? "Gastos Reales"
        : "Gastos Previstos"
    );
  });

  const movementsByAccount = buildExpenseMovementsByAccount({
    movements,
    movementTypeByAccount,
  });
  const expenseRows = balanceRows
    .map((row) => ({
      accountKey: row.accountId || row.accountNo || row.accountDescription,
      accountDescription: row.accountDescription || "-",
      amount: row.plannedExpense,
      percentage: 0,
      movements:
        movementsByAccount.get(
          row.accountId || row.accountNo || row.accountDescription
        ) ?? [],
    }))
    .filter((row) => row.amount > 0);
  const totalAmount = expenseRows.reduce(
    (total, row) => total + row.amount,
    0
  );

  if (totalAmount <= 0) {
    return [];
  }

  return expenseRows
    .map((row) => ({
      ...row,
      percentage: (row.amount / totalAmount) * 100,
    }))
    .sort((left, right) => right.amount - left.amount);
}

function getModeHref({
  dateValue,
  detail,
}: {
  dateValue: string;
  detail: boolean;
}) {
  const query: Record<string, string> = {};

  if (dateValue) {
    query.date = dateValue;
  }

  if (detail) {
    query.detail = "true";
  }

  return Object.keys(query).length > 0
    ? {
        pathname: "/reports/expense-distribution",
        query,
      }
    : "/reports/expense-distribution";
}

export default async function ExpenseDistributionPage({
  searchParams,
}: ExpenseDistributionPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const dateValue = getSingleSearchParam(resolvedSearchParams.date);
  const detailValue = getSingleSearchParam(resolvedSearchParams.detail);
  const showDetail = detailValue === "true" || detailValue === "1";
  const dateRange = parseDateRangeFilterValue(dateValue);
  const [{ supabase, tenant, activeCompany }, { dict }] = await Promise.all([
    requireCompanyContext(),
    getDictionary(),
  ]);

  let movements: TreasuryBalanceMovement[] = [];

  if (activeCompany) {
    try {
      movements = await listTreasuryBalanceMovements({
        supabase,
        tenantId: tenant.id,
        companyId: activeCompany.id,
        dateFrom: dateRange?.from ?? undefined,
        dateTo: dateRange?.to ?? undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      throw new Error(
        `${dict.reports.expenseDistributionReadError}: ${message}`
      );
    }
  }

  const rows = buildExpenseDistributionRows(movements);
  const totalAmount = rows.reduce((total, row) => total + row.amount, 0);

  return (
    <section className="max-w-4xl space-y-4">
      <div className="space-y-1">
        <Link href="/reports" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToReports}
        </Link>

        <h1 className="text-xl font-bold text-primary-app sm:text-3xl">
          {dict.reports.expenseDistribution}
        </h1>
      </div>

      <div className="max-w-xl">
        <FilterBar
          fields={[
            {
              type: "dateRange",
              name: "date",
              label: dict.reports.date,
            },
          ]}
          initialValues={{
            date: dateValue,
          }}
          labels={{
            apply: dict.common.applyFilters,
            clear: dict.common.clearFilters,
            filters: dict.common.filters,
            hideFilters: dict.common.hideFilters,
            invalidDateRange: dict.common.invalidDateRange,
          }}
        />
      </div>

      <div className="inline-flex rounded-lg border border-app-border bg-app-soft p-1 text-xs font-semibold">
        <Link
          href={getModeHref({ dateValue, detail: false })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "text-app-muted hover:bg-app hover:text-primary-app"
              : "bg-primary-app text-white"
          }`}
        >
          {dict.reports.summaryView}
        </Link>
        <Link
          href={getModeHref({ dateValue, detail: true })}
          className={`rounded-md px-3 py-1.5 transition ${
            showDetail
              ? "bg-primary-app text-white"
              : "text-app-muted hover:bg-app hover:text-primary-app"
          }`}
        >
          {dict.reports.detailView}
        </Link>
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.reports.emptyExpenseDistribution}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex max-w-[560px] items-center justify-between gap-3 border-b border-app-border pb-1.5 text-xs font-semibold text-primary-app sm:text-sm">
            <span>{dict.reports.totalExpense}</span>
            <span className="whitespace-nowrap tabular-nums">
              {formatDecimalValue(totalAmount)}
            </span>
          </div>

          <div className="max-w-[560px] space-y-2">
            {rows.map((row, index) => {
              const color = barColors[index % barColors.length];

              return (
                <div
                  key={row.accountKey}
                  className="grid gap-1 border-b border-app-border pb-2 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-semibold text-app">
                      {row.accountDescription}
                    </span>
                    <span className="whitespace-nowrap text-right font-semibold tabular-nums text-primary-app">
                      {formatDecimalValue(row.percentage, 1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-app-soft sm:h-3">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <span className="min-w-16 text-right text-[11px] font-medium tabular-nums text-app-muted sm:min-w-20 sm:text-xs">
                      {formatDecimalValue(row.amount)}
                    </span>
                  </div>

                  {showDetail && row.movements.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {row.movements.map((movement) => (
                        <div
                          key={movement.id}
                          className="grid grid-cols-[1fr_auto] gap-2 pl-3 text-[11px] text-app-muted sm:text-xs"
                        >
                          <span className="break-words">
                            {movement.description}
                          </span>
                          <span className="whitespace-nowrap text-right tabular-nums">
                            {formatDecimalValue(movement.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

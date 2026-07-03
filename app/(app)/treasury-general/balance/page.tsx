export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { formatDecimalValue } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import { parseDateRangeFilterValue } from "@/lib/search/dateRangeFilter";
import { getSingleSearchParam } from "@/lib/search/textSearch";
import {
  buildTreasuryBalanceRows,
  getTreasuryBalanceTotals,
  type TreasuryBalanceMovement,
  type TreasuryBalanceRow,
} from "@/lib/treasury/treasuryBalance";
import { listTreasuryBalanceMovements } from "@/lib/treasury/treasuryBalanceRepository";

import FilterBar from "../../components/FilterBar";

type TreasuryBalancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getBalanceTextClass(value: number) {
  if (value < 0) {
    return "text-red-700";
  }

  if (value > 0) {
    return "text-primary-app";
  }

  return "text-app-muted";
}

type TreasuryBalanceSectionProps = {
  title: string;
  rows: TreasuryBalanceRow[];
  mode: "income" | "expense";
  labels: {
    accountDescription: string;
    real: string;
    expected: string;
    balance: string;
    total: string;
  };
};

function TreasuryBalanceSection({
  title,
  rows,
  mode,
  labels,
}: TreasuryBalanceSectionProps) {
  const totals = getTreasuryBalanceTotals(rows);
  const isIncome = mode === "income";
  const realTotal = isIncome ? totals.realIncome : totals.realExpense;
  const expectedTotal = isIncome
    ? totals.expectedIncome
    : totals.expectedExpense;

  return (
    <section className="w-fit max-w-full space-y-1">
      <h2 className="border-l-2 border-primary-app px-2 py-0.5 text-xs font-semibold uppercase text-primary-app">
        {title}
      </h2>

      <div className="max-w-full overflow-x-auto rounded-xl border border-primary-app">
        <table className="w-[365px] table-fixed border-collapse text-[10px]">
          <colgroup>
            <col style={{ width: "160px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "75px" }} />
          </colgroup>

          <thead className="bg-app-soft text-primary-app">
            <tr>
              <th className="px-1.5 py-1 text-left font-semibold">
                {labels.accountDescription}
              </th>
              <th className="border-l border-app-border px-1 py-1 text-right font-medium">
                {labels.real}
              </th>
              <th className="px-1 py-1 text-right font-medium">
                {labels.expected}
              </th>
              <th className="border-l border-app-border px-1.5 py-1 text-right font-semibold">
                {labels.balance}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const real = isIncome ? row.realIncome : row.realExpense;
              const expected = isIncome
                ? row.expectedIncome
                : row.expectedExpense;
              const balance = isIncome
                ? row.realIncome + row.expectedIncome
                : -row.plannedExpense;

              return (
                <tr
                  key={row.accountId || row.accountNo}
                  className="border-t border-app-border bg-white"
                >
                  <td
                    className="px-1.5 py-1 text-app-muted"
                    title={row.accountDescription || undefined}
                  >
                    <span className="block truncate">
                      {row.accountDescription || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-l border-app-border px-1 py-1 text-right tabular-nums">
                    {formatDecimalValue(real)}
                  </td>
                  <td className="whitespace-nowrap px-1 py-1 text-right tabular-nums">
                    {formatDecimalValue(expected)}
                  </td>
                  <td
                    className={`whitespace-nowrap border-l border-app-border px-1.5 py-1 text-right font-bold tabular-nums ${getBalanceTextClass(
                      balance
                    )}`}
                  >
                    {formatDecimalValue(balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="border-t-2 border-primary-app bg-app-soft font-bold text-primary-app">
            <tr>
              <td className="px-1.5 py-1">{labels.total}</td>
              <td className="whitespace-nowrap border-l border-app-border px-1 py-1 text-right tabular-nums">
                {formatDecimalValue(realTotal)}
              </td>
              <td className="whitespace-nowrap px-1 py-1 text-right tabular-nums">
                {formatDecimalValue(expectedTotal)}
              </td>
              <td
                className={`whitespace-nowrap border-l border-app-border px-1.5 py-1 text-right tabular-nums ${getBalanceTextClass(
                  totals.plannedBalance
                )}`}
              >
                {formatDecimalValue(totals.plannedBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default async function TreasuryBalancePage({
  searchParams,
}: TreasuryBalancePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const dateValue = getSingleSearchParam(resolvedSearchParams.date);
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

      throw new Error(`${dict.treasuryBalance.errorReading}: ${message}`);
    }
  }

  const rows = buildTreasuryBalanceRows(movements);
  const totals = getTreasuryBalanceTotals(rows);
  const incomeRows = rows.filter(
    (row) => row.realIncome !== 0 || row.expectedIncome !== 0
  );
  const expenseRows = rows.filter(
    (row) => row.realExpense !== 0 || row.expectedExpense !== 0
  );

  return (
    <section className="max-w-[600px] space-y-3">
      <div className="space-y-1">
        <Link href="/treasury-general" className="link-app inline-block text-sm">
          ← {dict.treasuryBalance.backToTreasuryGeneral}
        </Link>

        <h1 className="text-base font-semibold leading-tight text-primary-app">
          {dict.treasuryBalance.title}
        </h1>

        <p className="max-w-5xl text-xs text-app-muted">
          {dict.treasuryBalance.helpText}
        </p>
      </div>

      <div className="max-w-xl">
        <FilterBar
          fields={[
            {
              type: "dateRange",
              name: "date",
              label: dict.treasuryBalance.date,
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

      {!activeCompany ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.treasuryBalance.noActiveCompanyDescription}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-app-border bg-app-soft p-4 text-sm text-app-muted">
          {dict.treasuryBalance.emptyList}
        </div>
      ) : (
        <div className="space-y-4">
          {incomeRows.length > 0 ? (
            <TreasuryBalanceSection
              title={dict.treasuryBalance.incomeGroup}
              rows={incomeRows}
              mode="income"
              labels={{
                accountDescription:
                  dict.treasuryBalance.accountDescription,
                real: dict.treasuryBalance.realShort,
                expected: dict.treasuryBalance.expectedShort,
                balance: dict.treasuryBalance.balance,
                total: dict.treasuryBalance.total,
              }}
            />
          ) : null}

          {expenseRows.length > 0 ? (
            <TreasuryBalanceSection
              title={dict.treasuryBalance.expenseGroup}
              rows={expenseRows}
              mode="expense"
              labels={{
                accountDescription:
                  dict.treasuryBalance.accountDescription,
                real: dict.treasuryBalance.realShort,
                expected: dict.treasuryBalance.expectedShort,
                balance: dict.treasuryBalance.balance,
                total: dict.treasuryBalance.total,
              }}
            />
          ) : null}

          <div
            id="real-balance"
            className="grid w-[365px] max-w-full grid-cols-[1fr_65px_65px_75px] items-center rounded-xl border border-primary-app bg-app-soft py-1.5 text-xs font-bold text-primary-app"
          >
            <span className="px-1.5">
              {dict.treasuryBalance.totalBalance}
            </span>
            <span
              className={`whitespace-nowrap px-1 text-right tabular-nums ${getBalanceTextClass(
                totals.realBalance
              )}`}
            >
              {formatDecimalValue(totals.realBalance)}
            </span>
            <span aria-hidden="true" />
            <span className={`whitespace-nowrap px-1.5 text-right tabular-nums ${getBalanceTextClass(
              totals.plannedBalance
            )}`}>
              {formatDecimalValue(totals.plannedBalance)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

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
} from "@/lib/treasury/treasuryBalance";

import FilterBar from "../../components/FilterBar";

type TreasuryBalancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const balancePageSize = 1000;

function getBalanceTextClass(value: number) {
  if (value < 0) {
    return "text-red-700";
  }

  if (value > 0) {
    return "text-primary-app";
  }

  return "text-app-muted";
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

  const movements: TreasuryBalanceMovement[] = [];

  if (activeCompany) {
    for (let page = 0; ; page += 1) {
      let query = supabase
        .from("treasury_general_movements")
        .select(
          "id, account_id, account_no, account_description, treasury_type, amount, movement_date"
        )
        .eq("tenant_id", tenant.id)
        .eq("company_id", activeCompany.id)
        .order("id", { ascending: true })
        .range(
          page * balancePageSize,
          page * balancePageSize + balancePageSize - 1
        );

      if (dateRange?.from) {
        query = query.gte("movement_date", dateRange.from);
      }

      if (dateRange?.to) {
        query = query.lte("movement_date", dateRange.to);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`${dict.treasuryBalance.errorReading}: ${error.message}`);
      }

      const pageMovements = data ?? [];
      movements.push(...pageMovements);

      if (pageMovements.length < balancePageSize) {
        break;
      }
    }
  }

  const rows = buildTreasuryBalanceRows(movements);
  const totals = getTreasuryBalanceTotals(rows);

  return (
    <section className="max-w-[1040px] space-y-3">
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
        <div className="overflow-x-auto rounded-xl border border-primary-app">
          <table className="min-w-[800px] w-full border-collapse text-[11px]">
            <thead className="bg-app-soft text-left text-primary-app">
              <tr>
                <th
                  rowSpan={2}
                  className="w-[280px] px-2.5 py-1.5 font-semibold"
                >
                  {dict.treasuryBalance.accountNo}
                </th>
                <th
                  colSpan={2}
                  className="border-l border-app-border px-2 py-1 text-center font-semibold"
                >
                  {dict.treasuryBalance.incomeGroup}
                </th>
                <th
                  colSpan={3}
                  className="border-l border-app-border px-2 py-1 text-center font-semibold"
                >
                  {dict.treasuryBalance.expenseGroup}
                </th>
                <th
                  rowSpan={2}
                  className="w-[100px] border-l border-app-border px-2.5 py-1.5 text-right font-semibold"
                >
                  {dict.treasuryBalance.balance}
                </th>
              </tr>
              <tr className="border-t border-app-border">
                <th className="w-[90px] border-l border-app-border px-2 py-1 text-right font-medium">
                  {dict.treasuryBalance.realShort}
                </th>
                <th className="w-[90px] px-2 py-1 text-right font-medium">
                  {dict.treasuryBalance.expectedShort}
                </th>
                <th className="w-[90px] border-l border-app-border px-2 py-1 text-right font-medium">
                  {dict.treasuryBalance.realShort}
                </th>
                <th className="w-[90px] px-2 py-1 text-right font-medium">
                  {dict.treasuryBalance.expectedShort}
                </th>
                <th className="w-[90px] px-2 py-1 text-right font-medium">
                  {dict.treasuryBalance.differenceShort}
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.accountId || row.accountNo}
                  className="border-t border-app-border bg-white"
                >
                  <td className="px-2.5 py-1.5">
                    <span className="font-semibold text-primary-app">
                      {row.accountNo || "-"}
                    </span>
                    <span className="ml-2 text-app-muted">
                      {row.accountDescription || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-l border-app-border px-2 py-1.5 text-right tabular-nums">
                    {formatDecimalValue(row.realIncome)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                    {formatDecimalValue(row.expectedIncome)}
                  </td>
                  <td className="whitespace-nowrap border-l border-app-border px-2 py-1.5 text-right tabular-nums">
                    {formatDecimalValue(row.realExpense)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                    {formatDecimalValue(row.expectedExpense)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium tabular-nums">
                    {formatDecimalValue(row.expenseDifference)}
                  </td>
                  <td
                    className={`whitespace-nowrap border-l border-app-border px-2.5 py-1.5 text-right font-bold tabular-nums ${getBalanceTextClass(
                      row.balance
                    )}`}
                  >
                    {formatDecimalValue(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="border-t-2 border-primary-app bg-app-soft font-bold text-primary-app">
              <tr>
                <td className="px-2.5 py-1.5">
                  {dict.treasuryBalance.total}
                </td>
                <td className="whitespace-nowrap border-l border-app-border px-2 py-1.5 text-right tabular-nums">
                  {formatDecimalValue(totals.realIncome)}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {formatDecimalValue(totals.expectedIncome)}
                </td>
                <td className="whitespace-nowrap border-l border-app-border px-2 py-1.5 text-right tabular-nums">
                  {formatDecimalValue(totals.realExpense)}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {formatDecimalValue(totals.expectedExpense)}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {formatDecimalValue(totals.expenseDifference)}
                </td>
                <td
                  className={`whitespace-nowrap border-l border-app-border px-2.5 py-1.5 text-right tabular-nums ${getBalanceTextClass(
                    totals.balance
                  )}`}
                >
                  {formatDecimalValue(totals.balance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

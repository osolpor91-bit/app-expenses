import {
  isTreasuryMovementType,
  type TreasuryMovementType,
} from "./treasuryGeneral";

export type TreasuryBalanceMovement = {
  id?: unknown;
  account_id?: unknown;
  account_no?: unknown;
  account_description?: unknown;
  treasury_type?: unknown;
  amount?: unknown;
  movement_date?: unknown;
  entry_description?: unknown;
  treasury_members?: unknown;
};

export type TreasuryBalanceRow = {
  accountId: string;
  accountNo: string;
  accountDescription: string;
  realIncome: number;
  expectedIncome: number;
  realExpense: number;
  expectedExpense: number;
  plannedExpense: number;
  plannedBalance: number;
  realBalance: number;
};

export type TreasuryBalanceTotals = Omit<
  TreasuryBalanceRow,
  "accountId" | "accountNo" | "accountDescription"
>;

function getAmount(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

export function getTreasuryBalanceMovementAccountKey(
  movement: TreasuryBalanceMovement
) {
  const accountId = String(movement.account_id ?? "").trim();
  const accountNo = String(movement.account_no ?? "").trim();
  const accountDescription = String(
    movement.account_description ?? ""
  ).trim();

  return accountId || accountNo || accountDescription;
}

function addMovementAmount(
  row: TreasuryBalanceRow,
  treasuryType: TreasuryMovementType,
  amount: number
) {
  if (treasuryType === "Ingresos Reales") {
    row.realIncome += amount;
  } else if (treasuryType === "Ingresos Previstos") {
    row.expectedIncome += amount;
  } else if (treasuryType === "Gastos Reales") {
    row.realExpense += amount;
  } else {
    row.expectedExpense += amount;
  }
}

export function buildTreasuryBalanceRows(
  movements: readonly TreasuryBalanceMovement[]
) {
  const rowsByAccount = new Map<string, TreasuryBalanceRow>();

  movements.forEach((movement) => {
    const accountKey = getTreasuryBalanceMovementAccountKey(movement);
    const treasuryType = String(movement.treasury_type ?? "").trim();

    if (!accountKey || !isTreasuryMovementType(treasuryType)) {
      return;
    }

    const existingRow = rowsByAccount.get(accountKey);
    const row =
      existingRow ??
      ({
        accountId: String(movement.account_id ?? "").trim(),
        accountNo: String(movement.account_no ?? "").trim(),
        accountDescription: String(
          movement.account_description ?? ""
        ).trim(),
        realIncome: 0,
        expectedIncome: 0,
        realExpense: 0,
        expectedExpense: 0,
        plannedExpense: 0,
        plannedBalance: 0,
        realBalance: 0,
      } satisfies TreasuryBalanceRow);

    addMovementAmount(
      row,
      treasuryType,
      getAmount(movement.amount)
    );

    rowsByAccount.set(accountKey, row);
  });

  return Array.from(rowsByAccount.values())
    .map((row) => {
      const plannedExpense = Math.max(
        row.expectedExpense,
        row.realExpense
      );

      return {
        ...row,
        plannedExpense,
        plannedBalance:
          row.realIncome + row.expectedIncome - plannedExpense,
        realBalance: row.realIncome - row.realExpense,
      };
    })
    .sort((left, right) =>
      left.accountNo.localeCompare(right.accountNo, "es", {
        numeric: true,
        sensitivity: "base",
      })
    );
}

export function getTreasuryBalanceTotals(
  rows: readonly TreasuryBalanceRow[]
): TreasuryBalanceTotals {
  return rows.reduce<TreasuryBalanceTotals>(
    (totals, row) => ({
      realIncome: totals.realIncome + row.realIncome,
      expectedIncome: totals.expectedIncome + row.expectedIncome,
      realExpense: totals.realExpense + row.realExpense,
      expectedExpense: totals.expectedExpense + row.expectedExpense,
      plannedExpense: totals.plannedExpense + row.plannedExpense,
      plannedBalance: totals.plannedBalance + row.plannedBalance,
      realBalance: totals.realBalance + row.realBalance,
    }),
    {
      realIncome: 0,
      expectedIncome: 0,
      realExpense: 0,
      expectedExpense: 0,
      plannedExpense: 0,
      plannedBalance: 0,
      realBalance: 0,
    }
  );
}

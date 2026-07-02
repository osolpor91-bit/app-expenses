import type { ReactNode } from "react";

export type AdminReadOnlyRecord = Record<string, unknown>;

type AdminReadOnlyTableProps = {
  rows: AdminReadOnlyRecord[];
  columnLabels: Record<string, string>;
  emptyLabel: string;
  yesLabel: string;
  noLabel: string;
  preferredColumns?: string[];
  hiddenColumns?: string[];
};

function getColumns(
  rows: AdminReadOnlyRecord[],
  preferredColumns: string[] = [],
  hiddenColumns: string[] = []
) {
  const discoveredColumns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const preferredExistingColumns = preferredColumns.filter((column) =>
    discoveredColumns.includes(column)
  );

  const remainingColumns = discoveredColumns.filter(
    (column) => !preferredExistingColumns.includes(column)
  );

  return [...preferredExistingColumns, ...remainingColumns].filter(
    (column) => !hiddenColumns.includes(column)
  );
}

function isIsoDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatValue(
  value: unknown,
  yesLabel: string,
  noLabel: string
): ReactNode {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? yesLabel : noLabel;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    if (isIsoDateLike(value)) {
      return new Date(value).toLocaleString();
    }

    return value;
  }

  return JSON.stringify(value);
}

export default function AdminReadOnlyTable({
  rows,
  columnLabels,
  emptyLabel,
  yesLabel,
  noLabel,
  preferredColumns = [],
  hiddenColumns = [],
}: AdminReadOnlyTableProps) {
  const columns = getColumns(rows, preferredColumns, hiddenColumns);

  return (
    <div className="overflow-x-auto rounded-xl border border-app">
      <table className="table-app min-w-[900px] text-xs sm:text-sm">
        <thead className="table-head-app">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-semibold">
                {columnLabels[column] ?? column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--color-border)] bg-app">
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="table-row-app">
              {columns.map((column) => (
                <td key={column} className="max-w-[320px] truncate px-3 py-2 text-app-muted">
                  {formatValue(row[column], yesLabel, noLabel)}
                </td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-4 text-app-muted" colSpan={Math.max(columns.length, 1)}>
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
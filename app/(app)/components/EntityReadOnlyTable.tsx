"use client";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useMemo, useState } from "react";

type EntityReadOnlyTableProps<TRecord extends { id: string }> = {
  records: TRecord[];
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  emptyLabel: string;
  minWidthClass?: string;
  primaryColumnDbName: string;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getCellValue: (record: TRecord, field: EntityFieldDefinition) => string;
  selectedRecordId?: string | null;
  onSelectRecord?: (record: TRecord) => void;
};

type SortDirection = "asc" | "desc";

type SortState = {
  fieldKey: string;
  direction: SortDirection;
};

type ColumnResizeState = {
  fieldKey: string;
  startX: number;
  startWidth: number;
};

const minColumnWidth = 72;
const maxColumnWidth = 640;
const maxAutoWidthSampleRecords = 100;
const estimatedCharacterWidth = 7.2;
const columnExtraWidth = 48;

function clampColumnWidth(width: number) {
  return Math.min(Math.max(width, minColumnWidth), maxColumnWidth);
}

function getCellTitle(value: string) {
  return value === "-" ? "" : value;
}

function getCellContentClassName(extraClassName = "") {
  return ["block truncate", extraClassName].filter(Boolean).join(" ");
}

function getComparableValue(value: string) {
  if (value === "-") {
    return "";
  }

  return value.trim().toLocaleLowerCase();
}

export default function EntityReadOnlyTable<TRecord extends { id: string }>({
  records,
  fields,
  fieldLabels,
  emptyLabel,
  minWidthClass = "min-w-[720px]",
  primaryColumnDbName,
  getFieldLabel,
  getCellValue,
  selectedRecordId = null,
  onSelectRecord,
}: EntityReadOnlyTableProps<TRecord>) {
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizeState, setResizeState] = useState<ColumnResizeState | null>(
    null
  );

  const defaultColumnWidths = useMemo(() => {
    const sampleRecords = records.slice(0, maxAutoWidthSampleRecords);

    return fields.reduce<Record<string, number>>((widths, field) => {
      const headerLength = getFieldLabel(fieldLabels, field).length;
      const maxValueLength = sampleRecords.reduce((maxLength, record) => {
        return Math.max(maxLength, getCellValue(record, field).length);
      }, headerLength);

      widths[field.key] = clampColumnWidth(
        Math.ceil(maxValueLength * estimatedCharacterWidth + columnExtraWidth)
      );

      return widths;
    }, {});
  }, [fields, fieldLabels, getCellValue, getFieldLabel, records]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const currentResizeState = resizeState;

    function handlePointerMove(event: PointerEvent) {
      const delta = event.clientX - currentResizeState.startX;

      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [currentResizeState.fieldKey]: clampColumnWidth(
          currentResizeState.startWidth + delta
        ),
      }));
    }

    function handlePointerUp() {
      setResizeState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeState]);

  const displayedRecords = useMemo(() => {
    if (!sortState) {
      return records;
    }

    const sortField = fields.find((field) => field.key === sortState.fieldKey);

    if (!sortField) {
      return records;
    }

    return [...records].sort((firstRecord, secondRecord) => {
      const firstValue = getComparableValue(getCellValue(firstRecord, sortField));
      const secondValue = getComparableValue(
        getCellValue(secondRecord, sortField)
      );

      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [fields, getCellValue, records, sortState]);

  function getColumnWidth(field: EntityFieldDefinition) {
    return columnWidths[field.key] ?? defaultColumnWidths[field.key] ?? 130;
  }

  function updateSort(field: EntityFieldDefinition) {
    setSortState((currentSortState) => {
      if (currentSortState?.fieldKey !== field.key) {
        return {
          fieldKey: field.key,
          direction: "asc",
        };
      }

      return {
        fieldKey: field.key,
        direction: currentSortState.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  function getSortIndicator(field: EntityFieldDefinition) {
    if (sortState?.fieldKey !== field.key) {
      return "↕";
    }

    return sortState.direction === "asc" ? "↑" : "↓";
  }

  function handleColumnResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    field: EntityFieldDefinition
  ) {
    event.preventDefault();
    event.stopPropagation();

    setColumnWidths((currentWidths) => ({
      ...currentWidths,
      [field.key]: getColumnWidth(field),
    }));

    setResizeState({
      fieldKey: field.key,
      startX: event.clientX,
      startWidth: getColumnWidth(field),
    });
  }

  function handleColumnWidthReset(
    event: ReactMouseEvent<HTMLButtonElement>,
    field: EntityFieldDefinition
  ) {
    event.preventDefault();
    event.stopPropagation();

    setColumnWidths((currentWidths) => {
      const nextWidths = { ...currentWidths };
      delete nextWidths[field.key];
      return nextWidths;
    });
  }

  function getHeaderClassName(index: number) {
    return [
      "sticky top-0 bg-app-soft px-3 py-1.5 pr-4 text-left align-middle font-semibold",
      index === 0 ? "left-0 z-30" : "z-20",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getBodyCellClassName(
    index: number,
    isPrimary: boolean,
    isSelected: boolean
  ) {
    return [
      "px-3 py-1.5 align-middle",
      isPrimary ? "font-medium" : "text-app-muted",
      index === 0
        ? `sticky left-0 z-10 ${isSelected ? "bg-app-soft" : "bg-app"}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <div className="mt-1 max-h-[calc(100vh-215px)] overflow-auto rounded-xl border border-app-border bg-app">
      <table className={`table-app ${minWidthClass} table-fixed text-xs sm:text-sm`}>
        <colgroup>
          {fields.map((field) => (
            <col
              key={field.key}
              style={{
                width: `${getColumnWidth(field)}px`,
              }}
            />
          ))}
        </colgroup>

        <thead className="table-head-app">
          <tr>
            {fields.map((field, index) => (
              <th key={field.key} className={getHeaderClassName(index)}>
                <button
                  type="button"
                  onClick={() => updateSort(field)}
                  className="flex w-full items-center gap-1 text-left"
                  title={getFieldLabel(fieldLabels, field)}
                >
                  <span className="truncate">
                    {getFieldLabel(fieldLabels, field)}
                  </span>
                  <span className="shrink-0 text-[10px] text-app-muted">
                    {getSortIndicator(field)}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={`Cambiar ancho de ${getFieldLabel(
                    fieldLabels,
                    field
                  )}`}
                  title="Arrastrar para cambiar ancho. Doble clic para autoajustar."
                  onPointerDown={(event) =>
                    handleColumnResizePointerDown(event, field)
                  }
                  onDoubleClick={(event) =>
                    handleColumnWidthReset(event, field)
                  }
                  className="group absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize touch-none"
                >
                  <span className="mx-auto block h-full w-px bg-transparent transition group-hover:bg-primary-app" />
                </button>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--color-border)] bg-app">
          {displayedRecords.map((record) => {
            const isSelected = selectedRecordId === record.id;

            return (
            <tr
              key={record.id}
              className={[
                "table-row-app",
                onSelectRecord ? "cursor-pointer" : "",
                isSelected ? "bg-app-soft outline outline-1 outline-primary-app" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectRecord?.(record)}
            >
              {fields.map((field, index) => {
                const value = getCellValue(record, field);
                const isPrimary = field.dbName === primaryColumnDbName;

                return (
                  <td
                    key={field.key}
                    className={getBodyCellClassName(
                      index,
                      isPrimary,
                      isSelected
                    )}
                    title={getCellTitle(value)}
                  >
                    <span className={getCellContentClassName()}>{value}</span>
                  </td>
                );
              })}
            </tr>
          );
          })}

          {displayedRecords.length === 0 && (
            <tr>
              <td className="px-3 py-4 text-app-muted" colSpan={fields.length}>
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

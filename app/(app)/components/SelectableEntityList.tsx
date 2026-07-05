"use client";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EntityOperationResult } from "@/lib/services/entityService";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ActionsMenu from "./ActionsMenu";

export type SelectableEntityRecord = {
  id: string;
  tenant_id?: string | null;
  company_id?: string | null;
  [key: string]: unknown;
};

type DeleteRecordAction = (
  id: string
) => Promise<EntityOperationResult<{ id: string }>>;

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

type SelectableEntityListRecordActionDefinition = {
  key: string;
  labelKey: string;
  route: string;
  recordIdParamName: string;
};

type SelectableEntityListActionsDefinition = {
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  recordActions?: readonly SelectableEntityListRecordActionDefinition[];
};

type SelectableEntityListLabels = {
  title: string;
  emptyList: string;
  listHelpText: string;
  new: string;
  edit: string;
  delete: string;
  deleting: string;
  actions: string;
  noActionsAvailable: string;
  selectRecordToDelete: string;
  confirmDelete: string;
  deleteError: string;
  noRowsDeleted: string;
  recordDeleted: string;
  scopeUnavailableMessage?: string;
  [key: string]: string | undefined;
};

type SelectableEntityListProps<TRecord extends SelectableEntityRecord> = {
  records: TRecord[];
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  labels: SelectableEntityListLabels;
  newHref: string;
  minWidthClass?: string;
  compact?: boolean;
  compactTable?: boolean;
  primaryFieldDbName: string;
  renderToolbarContent?: (selectedRecord: TRecord | null) => ReactNode;
  actionsContent?: ReactNode;
  listActions?: SelectableEntityListActionsDefinition;
  getDeleteDisabledReason?: (selectedRecord: TRecord) => string | null;
  scopeAvailable?: boolean;
  autoSelectFirstRecord?: boolean;
  renderSidePanel?: (selectedRecord: TRecord | null) => ReactNode;
  deleteRecordAction: DeleteRecordAction;
  getRecordHref: (record: TRecord) => string;
  getRecordName: (record: TRecord) => string;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getCellValue: (record: TRecord, field: EntityFieldDefinition) => string;
  getCellHref?: (
    record: TRecord,
    field: EntityFieldDefinition
  ) => string | null;
};

function getBodyCellClassName(
  field: EntityFieldDefinition,
  compact: boolean
) {
  const baseClassName = compact
    ? "px-2 py-1 align-middle"
    : "px-3 py-1.5 align-middle";

  if (field.calculated) {
    return `${baseClassName} font-semibold text-primary-app`;
  }

  return `${baseClassName} text-app-muted`;
}

function getCellContentClassName(extraClassName = "") {
  return `block w-full truncate whitespace-nowrap ${extraClassName}`.trim();
}

function getCellTitle(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue && trimmedValue !== "-" ? trimmedValue : undefined;
}

function clampColumnWidth(width: number) {
  return Math.min(Math.max(width, minColumnWidth), maxColumnWidth);
}

function clampAutoColumnWidth({
  width,
  headerWidth,
  field,
  primaryFieldDbName,
}: {
  width: number;
  headerWidth: number;
  field: EntityFieldDefinition;
  primaryFieldDbName: string;
}) {
  const minAutoWidth = getMinAutoColumnWidth({
    field,
    primaryFieldDbName,
  });

  const maxAutoWidth = Math.max(
    headerWidth,
    getMaxAutoColumnWidth({
      field,
      primaryFieldDbName,
    })
  );

  return Math.min(Math.max(width, minAutoWidth), maxAutoWidth);
}

function getMinAutoColumnWidth({
  field,
  primaryFieldDbName,
}: {
  field: EntityFieldDefinition;
  primaryFieldDbName: string;
}) {
  if (field.dbName === primaryFieldDbName) {
    return 120;
  }

  if (field.type === "date") {
    return 110;
  }

  if (field.type === "decimal") {
    return 105;
  }

  if (field.type === "boolean") {
    return 80;
  }

  if (field.type === "select" || field.type === "option") {
    return 80;
  }

  return minColumnWidth;
}

function getMaxAutoColumnWidth({
  field,
  primaryFieldDbName,
}: {
  field: EntityFieldDefinition;
  primaryFieldDbName: string;
}) {
  if (field.dbName === primaryFieldDbName) {
    return 280;
  }

  if (field.relation) {
    return 260;
  }

  if (field.type === "date") {
    return 130;
  }

  if (field.type === "decimal") {
    return 145;
  }

  if (field.type === "boolean") {
    return 100;
  }

  if (field.type === "select" || field.type === "option") {
    return 130;
  }

  if (field.type === "email" || field.type === "tel") {
    return 240;
  }

  return 280;
}

function estimateTextWidth(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue || normalizedValue === "-") {
    return minColumnWidth;
  }

  return Math.ceil(
    normalizedValue.length * estimatedCharacterWidth + columnExtraWidth
  );
}

function getAutoColumnWidth<TRecord extends SelectableEntityRecord>({
  field,
  records,
  fieldLabels,
  primaryFieldDbName,
  getFieldLabel,
  getRecordName,
  getCellValue,
}: {
  field: EntityFieldDefinition;
  records: TRecord[];
  fieldLabels: Record<string, string>;
  primaryFieldDbName: string;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getRecordName: (record: TRecord) => string;
  getCellValue: (record: TRecord, field: EntityFieldDefinition) => string;
}) {
  const headerWidth = estimateTextWidth(getFieldLabel(fieldLabels, field));
  const sampleRecords = records.slice(0, maxAutoWidthSampleRecords);

  const contentWidth = sampleRecords.reduce((maxWidth, record) => {
    const value =
      field.dbName === primaryFieldDbName
        ? getRecordName(record)
        : getCellValue(record, field);

    return Math.max(maxWidth, estimateTextWidth(value));
  }, headerWidth);

  return clampAutoColumnWidth({
    width: contentWidth,
    headerWidth,
    field,
    primaryFieldDbName,
  });
}

function getInitialColumnWidths<TRecord extends SelectableEntityRecord>({
  fields,
  records,
  fieldLabels,
  primaryFieldDbName,
  getFieldLabel,
  getRecordName,
  getCellValue,
}: {
  fields: readonly EntityFieldDefinition[];
  records: TRecord[];
  fieldLabels: Record<string, string>;
  primaryFieldDbName: string;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getRecordName: (record: TRecord) => string;
  getCellValue: (record: TRecord, field: EntityFieldDefinition) => string;
}) {
  return fields.reduce<Record<string, number>>((widths, field) => {
    widths[field.key] = getAutoColumnWidth({
      field,
      records,
      fieldLabels,
      primaryFieldDbName,
      getFieldLabel,
      getRecordName,
      getCellValue,
    });

    return widths;
  }, {});
}

function getColumnWidth({
  field,
  columnWidths,
  primaryFieldDbName,
}: {
  field: EntityFieldDefinition;
  columnWidths: Record<string, number>;
  primaryFieldDbName: string;
}) {
  return (
    columnWidths[field.key] ??
    getMinAutoColumnWidth({
      field,
      primaryFieldDbName,
    })
  );
}

function normalizeSortText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es-ES");
}

function getRawSortValue<TRecord extends SelectableEntityRecord>({
  record,
  field,
  primaryFieldDbName,
  getRecordName,
}: {
  record: TRecord;
  field: EntityFieldDefinition;
  primaryFieldDbName: string;
  getRecordName: (record: TRecord) => string;
}) {
  if (field.dbName === primaryFieldDbName) {
    return getRecordName(record);
  }

  if (field.relation) {
    const relationDisplayFieldName =
      field.relation.displayFieldName ?? field.dbName;

    return record[relationDisplayFieldName];
  }

  return record[field.dbName];
}

function compareSortValues({
  leftValue,
  rightValue,
  field,
}: {
  leftValue: unknown;
  rightValue: unknown;
  field: EntityFieldDefinition;
}) {
  const leftIsEmpty =
    leftValue === null || leftValue === undefined || leftValue === "";
  const rightIsEmpty =
    rightValue === null || rightValue === undefined || rightValue === "";

  if (leftIsEmpty && rightIsEmpty) {
    return 0;
  }

  if (leftIsEmpty) {
    return 1;
  }

  if (rightIsEmpty) {
    return -1;
  }

  if (field.type === "decimal") {
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
  }

  if (field.type === "boolean") {
    const leftBoolean = Boolean(leftValue);
    const rightBoolean = Boolean(rightValue);

    if (leftBoolean === rightBoolean) {
      return 0;
    }

    return leftBoolean ? 1 : -1;
  }

  return normalizeSortText(leftValue).localeCompare(
    normalizeSortText(rightValue),
    "es-ES",
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function sortSelectableRecords<TRecord extends SelectableEntityRecord>({
  records,
  fields,
  sortState,
  primaryFieldDbName,
  getRecordName,
}: {
  records: TRecord[];
  fields: readonly EntityFieldDefinition[];
  sortState: SortState | null;
  primaryFieldDbName: string;
  getRecordName: (record: TRecord) => string;
}) {
  if (!sortState) {
    return records;
  }

  const sortField = fields.find((field) => field.key === sortState.fieldKey);

  if (!sortField) {
    return records;
  }

  const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

  return [...records].sort((leftRecord, rightRecord) => {
    const leftValue = getRawSortValue({
      record: leftRecord,
      field: sortField,
      primaryFieldDbName,
      getRecordName,
    });

    const rightValue = getRawSortValue({
      record: rightRecord,
      field: sortField,
      primaryFieldDbName,
      getRecordName,
    });

    return (
      compareSortValues({
        leftValue,
        rightValue,
        field: sortField,
      }) * directionMultiplier
    );
  });
}

function getInitialSelectedRecordId<TRecord extends SelectableEntityRecord>({
  records,
  autoSelectFirstRecord,
}: {
  records: TRecord[];
  autoSelectFirstRecord: boolean;
}) {
  if (!autoSelectFirstRecord) {
    return null;
  }

  return records[0]?.id ?? null;
}

export default function SelectableEntityList<
  TRecord extends SelectableEntityRecord,
>({
  records,
  fields,
  fieldLabels,
  labels,
  newHref,
  minWidthClass = "",
  compact = false,
  compactTable = compact,
  primaryFieldDbName,
  renderToolbarContent,
  actionsContent = null,
  listActions,
  getDeleteDisabledReason,
  scopeAvailable = true,
  autoSelectFirstRecord = false,
  renderSidePanel,
  deleteRecordAction,
  getRecordHref,
  getRecordName,
  getFieldLabel,
  getCellValue,
  getCellHref,
}: SelectableEntityListProps<TRecord>) {
  const router = useRouter();

  const [currentRecords, setCurrentRecords] = useState<TRecord[]>(records);
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    getInitialColumnWidths({
      fields,
      records,
      fieldLabels,
      primaryFieldDbName,
      getFieldLabel,
      getRecordName,
      getCellValue,
    })
  );
  const [manuallyResizedColumnKeys, setManuallyResizedColumnKeys] = useState<
    Record<string, true>
  >({});
  const [resizingColumn, setResizingColumn] =
    useState<ColumnResizeState | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(() =>
    getInitialSelectedRecordId({
      records,
      autoSelectFirstRecord,
    })
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRecords(records);

    setSelectedRecordId((currentSelectedRecordId) => {
      if (
        currentSelectedRecordId &&
        records.some((record) => record.id === currentSelectedRecordId)
      ) {
        return currentSelectedRecordId;
      }

      return getInitialSelectedRecordId({
        records,
        autoSelectFirstRecord,
      });
    });
  }, [records, autoSelectFirstRecord]);

  useEffect(() => {
    setColumnWidths((currentColumnWidths) => {
      const nextColumnWidths: Record<string, number> = {};
      let hasChanged = false;

      for (const field of fields) {
        const currentWidth = currentColumnWidths[field.key];

        const nextWidth = manuallyResizedColumnKeys[field.key]
          ? currentWidth ??
          getAutoColumnWidth({
            field,
            records,
            fieldLabels,
            primaryFieldDbName,
            getFieldLabel,
            getRecordName,
            getCellValue,
          })
          : getAutoColumnWidth({
            field,
            records,
            fieldLabels,
            primaryFieldDbName,
            getFieldLabel,
            getRecordName,
            getCellValue,
          });

        nextColumnWidths[field.key] = nextWidth;

        if (currentWidth !== nextWidth) {
          hasChanged = true;
        }
      }

      const currentKeys = Object.keys(currentColumnWidths);

      if (currentKeys.length !== fields.length) {
        hasChanged = true;
      }

      return hasChanged ? nextColumnWidths : currentColumnWidths;
    });
  }, [
    fields,
    records,
    fieldLabels,
    primaryFieldDbName,
    getFieldLabel,
    getRecordName,
    getCellValue,
    manuallyResizedColumnKeys,
  ]);

  useEffect(() => {
    if (!resizingColumn) {
      return;
    }

    const currentResizingColumn = resizingColumn;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: PointerEvent) {
      setColumnWidths((currentColumnWidths) => {
        const nextWidth = clampColumnWidth(
          currentResizingColumn.startWidth +
          event.clientX -
          currentResizingColumn.startX
        );

        return {
          ...currentColumnWidths,
          [currentResizingColumn.fieldKey]: nextWidth,
        };
      });
    }

    function handlePointerUp() {
      setResizingColumn(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [resizingColumn]);

  const selectedRecord = useMemo(() => {
    return (
      currentRecords.find((record) => record.id === selectedRecordId) ?? null
    );
  }, [currentRecords, selectedRecordId]);

  const displayedRecords = useMemo(
    () =>
      sortSelectableRecords({
        records: currentRecords,
        fields,
        sortState,
        primaryFieldDbName,
        getRecordName,
      }),
    [currentRecords, fields, sortState, primaryFieldDbName, getRecordName]
  );

  const totalColumnWidth = useMemo(
    () =>
      fields.reduce(
        (totalWidth, field) =>
          totalWidth +
          getColumnWidth({
            field,
            columnWidths,
            primaryFieldDbName,
          }),
        0
      ),
    [fields, columnWidths, primaryFieldDbName]
  );

  const resolvedListActions = listActions ?? {};
  const canCreate = resolvedListActions.create !== false;
  const canEdit = resolvedListActions.edit !== false;
  const canDelete = resolvedListActions.delete !== false;
  const recordActions = resolvedListActions.recordActions ?? [];
  const deleteDisabledReason = selectedRecord
    ? getDeleteDisabledReason?.(selectedRecord) ?? null
    : null;

  function getRecordActionLabel(
    action: SelectableEntityListRecordActionDefinition
  ) {
    return labels[action.labelKey] ?? action.labelKey;
  }

  function handleRecordAction(
    action: SelectableEntityListRecordActionDefinition
  ) {
    if (!selectedRecordId) {
      return;
    }

    const params = new URLSearchParams();
    params.set(action.recordIdParamName, selectedRecordId);

    router.push(`${action.route}?${params.toString()}`);
  }

  function handleNew() {
    if (!scopeAvailable) {
      setMessage(labels.scopeUnavailableMessage ?? labels.emptyList);
      return;
    }

    router.push(newHref);
  }

  function handleEdit() {
    if (!canEdit || !selectedRecord) {
      return;
    }

    router.push(getRecordHref(selectedRecord));
  }

  function handleSort(field: EntityFieldDefinition) {
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

  function handleColumnResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    field: EntityFieldDefinition
  ) {
    event.preventDefault();
    event.stopPropagation();

    setManuallyResizedColumnKeys((currentKeys) => ({
      ...currentKeys,
      [field.key]: true,
    }));

    setResizingColumn({
      fieldKey: field.key,
      startX: event.clientX,
      startWidth: getColumnWidth({
        field,
        columnWidths,
        primaryFieldDbName,
      }),
    });
  }

  function handleColumnWidthReset(
    event: ReactMouseEvent<HTMLButtonElement>,
    field: EntityFieldDefinition
  ) {
    event.preventDefault();
    event.stopPropagation();

    setManuallyResizedColumnKeys((currentKeys) => {
      const nextKeys = { ...currentKeys };
      delete nextKeys[field.key];

      return nextKeys;
    });

    setColumnWidths((currentColumnWidths) => ({
      ...currentColumnWidths,
      [field.key]: getAutoColumnWidth({
        field,
        records: currentRecords,
        fieldLabels,
        primaryFieldDbName,
        getFieldLabel,
        getRecordName,
        getCellValue,
      }),
    }));
  }

  function getSortIndicator(field: EntityFieldDefinition) {
    if (sortState?.fieldKey !== field.key) {
      return "↕";
    }

    return sortState.direction === "asc" ? "↑" : "↓";
  }

  async function handleDelete() {
    if (!scopeAvailable) {
      setMessage(labels.scopeUnavailableMessage ?? labels.emptyList);
      return;
    }

    if (!selectedRecordId || !selectedRecord) {
      setMessage(labels.selectRecordToDelete);
      return;
    }

    if (deleteDisabledReason) {
      setMessage(deleteDisabledReason);
      return;
    }

    const confirmed = window.confirm(
      labels.confirmDelete.replace("{name}", getRecordName(selectedRecord))
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const result = await deleteRecordAction(selectedRecordId);

    setIsDeleting(false);

    if (!result.ok) {
      setMessage(`${labels.deleteError}: ${result.error}`);
      return;
    }

    const nextRecords = currentRecords.filter(
      (record) => record.id !== selectedRecordId
    );

    setCurrentRecords(nextRecords);
    setSelectedRecordId(
      getInitialSelectedRecordId({
        records: nextRecords,
        autoSelectFirstRecord,
      })
    );
    setMessage(labels.recordDeleted);
    router.refresh();
  }

  const listContent = (
    <section>
      <div
        className={
          compact
            ? "sticky top-[84px] z-[80] bg-app pb-1 pt-0"
            : "sticky top-[168px] z-[80] -mx-4 bg-app px-4 pb-1 pt-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        }
      >
        <h2 className="sr-only">{labels.title}</h2>

        <div className="flex flex-wrap items-center gap-2">
          {canCreate ? (
            <button
              type="button"
              onClick={handleNew}
              className="btn-primary-app px-3 py-1.5 text-xs"
            >
              {labels.new}
            </button>
          ) : null}

          {renderToolbarContent?.(selectedRecord)}

          {canEdit ? (
            <button
              type="button"
              onClick={handleEdit}
              disabled={!selectedRecordId}
              className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {labels.edit}
            </button>
          ) : null}

          {recordActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleRecordAction(action)}
              disabled={!selectedRecordId}
              className="btn-secondary-app px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getRecordActionLabel(action)}
            </button>
          ))}

          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={
                !selectedRecordId || isDeleting || Boolean(deleteDisabledReason)
              }
              title={deleteDisabledReason ?? undefined}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? labels.deleting : labels.delete}
            </button>
          ) : null}

          {actionsContent ? (
            <div className="flex items-center text-xs">
              <ActionsMenu
                label={labels.actions}
                emptyLabel={labels.noActionsAvailable}
              >
                {actionsContent}
              </ActionsMenu>
            </div>
          ) : null}
        </div>

        {message && (
          <div className="mt-2 rounded-lg border border-app-border bg-app-soft px-3 py-1.5 text-xs text-app-muted">
            {message}
          </div>
        )}
      </div>

      <div className="mt-1 max-h-[calc(100vh-255px)] overflow-auto rounded-xl border border-app-border bg-app">
        <table
          className={`table-app table-fixed ${minWidthClass} text-xs ${
            compactTable ? "" : "sm:text-sm"
          }`}
          style={{ width: `max(100%, ${totalColumnWidth}px)` }}
        >
          <colgroup>
            {fields.map((field) => (
              <col
                key={field.key}
                style={{
                  width: `${getColumnWidth({
                    field,
                    columnWidths,
                    primaryFieldDbName,
                  })}px`,
                }}
              />
            ))}
          </colgroup>
          <thead className="table-head-app">
            <tr>
              {fields.map((field) => (
                <th
                  key={field.key}
                  className={`sticky top-0 z-20 bg-app-soft text-left align-middle font-semibold ${
                    compactTable ? "px-2 py-1 pr-3" : "px-3 py-1.5 pr-4"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(field)}
                    className="flex w-full items-center gap-1 truncate text-left font-semibold transition hover:text-primary-app"
                    title="Ordenar"
                  >
                    <span className="truncate">{getFieldLabel(fieldLabels, field)}</span>
                    <span className="shrink-0 text-[10px] text-app-muted">
                      {getSortIndicator(field)}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Cambiar ancho de ${getFieldLabel(fieldLabels, field)}`}
                    title="Arrastrar para cambiar ancho. Doble clic para autoajustar."
                    onPointerDown={(event) => handleColumnResizePointerDown(event, field)}
                    onDoubleClick={(event) => handleColumnWidthReset(event, field)}
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
              const isSelected = record.id === selectedRecordId;

              return (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  onDoubleClick={() => {
                    if (canEdit) {
                      router.push(getRecordHref(record));
                    }
                  }}
                  className={`cursor-pointer ${isSelected ? "bg-[var(--color-bg-soft)]" : "table-row-app"
                    }`}
                >
                  {fields.map((field) => {
                    if (field.dbName === primaryFieldDbName) {
                      return (
                        <td
                          key={field.key}
                          className={
                            compactTable
                              ? "px-2 py-1 align-middle font-medium"
                              : "px-3 py-1.5 align-middle font-medium"
                          }
                          title={getCellTitle(getRecordName(record))}
                        >
                          {canEdit ? (
                            <Link
                              href={getRecordHref(record)}
                              className={getCellContentClassName("text-primary-app hover:underline")}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {getRecordName(record)}
                            </Link>
                          ) : (
                            <span className={getCellContentClassName()}>
                              {getRecordName(record)}
                            </span>
                          )}
                        </td>
                      );
                    }

                    const cellValue = getCellValue(record, field);
                    const cellHref = getCellHref?.(record, field) ?? null;

                    return (
                      <td
                        key={field.key}
                        className={getBodyCellClassName(field, compactTable)}
                        title={getCellTitle(cellValue)}
                      >
                        {cellHref ? (
                          <Link
                            href={cellHref}
                            className={getCellContentClassName("text-primary-app hover:underline")}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {cellValue}
                          </Link>
                        ) : (
                          <span className={getCellContentClassName()}>{cellValue}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {displayedRecords.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-app-muted" colSpan={fields.length}>
                  {labels.emptyList}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p
        className={`${compactTable ? "mt-2" : "mt-3"} text-xs text-app-muted`}
      >
        {labels.listHelpText}
      </p>
    </section>
  );

  if (!renderSidePanel) {
    return listContent;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>{listContent}</div>

      <aside>
        <div className="sticky top-24">
          {renderSidePanel(selectedRecord)}
        </div>
      </aside>
    </section>
  );
}

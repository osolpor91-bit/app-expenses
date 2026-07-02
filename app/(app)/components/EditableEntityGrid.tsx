"use client";

import type { EntityOperationResult } from "@/lib/services/entityService";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  CellFocusedEvent,
  CellValueChangedEvent,
  ColDef,
  SelectionChangedEvent,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export type EditableGridRecord = {
  id: string;
  tenant_id: string | null;
  is_new?: boolean;
  [key: string]: unknown;
};

type EditableGridPayload = Record<string, string | boolean | null>;

type CreateGridRecordAction<TRecord extends EditableGridRecord> = (
  payload: EditableGridPayload
) => Promise<EntityOperationResult<{ record: TRecord }>>;

type UpdateGridRecordAction<TRecord extends EditableGridRecord> = (input: {
  id: string;
  payload: EditableGridPayload;
}) => Promise<EntityOperationResult<{ record: TRecord }>>;

type DeleteGridRecordsAction = (
  ids: string[]
) => Promise<EntityOperationResult<{ ids: string[] }>>;

type EditableEntityGridLabels = {
  deleteSelected: string;
  selectedSuffix: string;
  helpText: string;
  createRequiredFields: string;
  requiredFields: string;
  saveError: string;
  createError: string;
  deleteError: string;
  changeSaved: string;
  selectAtLeastOneToDelete: string;
  confirmDelete: string;
  noRowsDeleted: string;
};

type GridMessage = {
  text: string;
  variant: "info" | "error";
};

type NewRowCreateMode = "onRowLeave" | "whenReady";

type EditableEntityGridProps<TRecord extends EditableGridRecord> = {
  tenantId: string;
  newRowId: string;
  records: TRecord[];
  columns: ColDef<TRecord>[];
  backButton?: ReactNode;
  labels: EditableEntityGridLabels;
  createdMessage: string;
  deletedMessage: string;
  heightClass?: string;
  newRowCreateMode?: NewRowCreateMode;
  createEmptyRow: (tenantId: string) => TRecord;
  sortRows: (rows: TRecord[]) => TRecord[];
  cleanRowsForParent: (rows: TRecord[]) => TRecord[];
  buildPayload: (row: TRecord) => EditableGridPayload;
  validateRow: (row: TRecord, isNew: boolean) => string | null;
  validatePartialNewRow?: (row: TRecord) => string | null;
  isNewRowReadyToCreate?: (row: TRecord) => boolean;
  createRecordAction: CreateGridRecordAction<TRecord>;
  updateRecordAction: UpdateGridRecordAction<TRecord>;
  deleteRecordsAction: DeleteGridRecordsAction;
  onRowsChange?: (rows: TRecord[]) => void;
  afterCreateRow?: (
    createdRow: TRecord,
    newRow: TRecord,
    payload: EditableGridPayload
  ) => TRecord;
};

export default function EditableEntityGrid<TRecord extends EditableGridRecord>({
  tenantId,
  newRowId,
  records,
  columns,
  backButton,
  labels,
  createdMessage,
  deletedMessage,
  heightClass = "h-[460px]",
  newRowCreateMode = "onRowLeave",
  createEmptyRow,
  sortRows,
  cleanRowsForParent,
  buildPayload,
  validateRow,
  validatePartialNewRow,
  isNewRowReadyToCreate = () => true,
  createRecordAction,
  updateRecordAction,
  deleteRecordsAction,
  onRowsChange,
  afterCreateRow,
}: EditableEntityGridProps<TRecord>) {
  const gridRef = useRef<AgGridReact<TRecord>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const rowDataRef = useRef<TRecord[]>([]);
  const lastFocusedRowIdRef = useRef<string | null>(null);
  const isCreatingNewRowRef = useRef(false);

  const [rowData, setRowData] = useState<TRecord[]>([
    ...sortRows(records),
    createEmptyRow(tenantId),
  ]);
  const [message, setMessage] = useState<GridMessage | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const nextRows = [...sortRows(records), createEmptyRow(tenantId)];
    rowDataRef.current = nextRows;
    setRowData(nextRows);
    setSelectedCount(0);
  }, [records, tenantId, createEmptyRow, sortRows]);

  useEffect(() => {
    rowDataRef.current = rowData;
  }, [rowData]);

  function setRows(nextRows: TRecord[]) {
    rowDataRef.current = nextRows;
    setRowData(nextRows);
  }

  function showTemporaryMessage(
    text: string,
    variant: GridMessage["variant"] = "info"
  ) {
    setMessage({
      text,
      variant,
    });

    setTimeout(() => {
      setMessage(null);
    }, 3500);
  }

  function handleSelectionChanged(event: SelectionChangedEvent<TRecord>) {
    const selectedRows = event.api
      .getSelectedRows()
      .filter((row) => !row.is_new);

    setSelectedCount(selectedRows.length);
  }

  function restartEditingCell(event: CellValueChangedEvent<TRecord>) {
    const rowIndex = event.rowIndex;
    const colKey = event.column.getColId();

    if (rowIndex === null || rowIndex === undefined || !colKey) {
      return;
    }

    window.setTimeout(() => {
      event.api.setFocusedCell(rowIndex, colKey);
      event.api.startEditingCell({
        rowIndex,
        colKey,
      });
    }, 0);
  }

  function revertChangedCell(event: CellValueChangedEvent<TRecord>) {
    const fieldName = event.colDef.field;

    if (!fieldName) {
      return;
    }

    setRows(
      rowDataRef.current.map((row) =>
        row.id === event.data.id
          ? {
            ...row,
            [fieldName]: event.oldValue,
          }
          : row
      )
    );
  }

  function getNewRow() {
    return rowDataRef.current.find((row) => row.id === newRowId) ?? null;
  }

  function isEmptyGridValue(value: unknown) {
    return value === null || value === undefined || String(value).trim() === "";
  }

  function newRowHasUserChanges(row: TRecord) {
    const emptyRow = createEmptyRow(tenantId);

    return Object.entries(row).some(([key, value]) => {
      if (key === "id" || key === "tenant_id" || key === "is_new") {
        return false;
      }

      const initialValue = emptyRow[key];

      if (isEmptyGridValue(value) && isEmptyGridValue(initialValue)) {
        return false;
      }

      if (typeof value === "boolean" || typeof initialValue === "boolean") {
        return Boolean(value) !== Boolean(initialValue);
      }

      return String(value ?? "").trim() !== String(initialValue ?? "").trim();
    });
  }

  async function createRecordFromNewRow(
    newRow: TRecord,
    event?: CellValueChangedEvent<TRecord>
  ) {
    if (isCreatingNewRowRef.current) {
      return;
    }

    const validationMessage = validateRow(newRow, true);

    if (validationMessage) {
      showTemporaryMessage(validationMessage, "error");

      if (event) {
        revertChangedCell(event);
        restartEditingCell(event);
      }

      return;
    }

    isCreatingNewRowRef.current = true;

    const payload = buildPayload(newRow);
    const result = await createRecordAction(payload);

    isCreatingNewRowRef.current = false;

    if (!result.ok) {
      showTemporaryMessage(`${labels.createError}: ${result.error}`, "error");

      if (event) {
        revertChangedCell(event);
        restartEditingCell(event);
      }

      return;
    }

    const createdRow = afterCreateRow
      ? afterCreateRow(result.data.record, newRow, payload)
      : result.data.record;

    const updatedRows = sortRows([
      ...rowDataRef.current.filter((row) => row.id !== newRowId),
      createdRow,
    ]);

    const nextRows = [...updatedRows, createEmptyRow(tenantId)];

    setRows(nextRows);
    onRowsChange?.(cleanRowsForParent(updatedRows));

    showTemporaryMessage(createdMessage);
  }

  async function tryCreateNewRowOnLeave() {
    const newRow = getNewRow();

    if (!newRow || !newRowHasUserChanges(newRow)) {
      return;
    }

    if (!isNewRowReadyToCreate(newRow)) {
      const validationMessage = validateRow(newRow, true);

      if (validationMessage) {
        showTemporaryMessage(validationMessage, "error");
      }

      return;
    }

    await createRecordFromNewRow(newRow);
  }

  async function updateExistingRecord(event: CellValueChangedEvent<TRecord>) {
    const updatedRecord = event.data;
    const payload = buildPayload(updatedRecord);

    const result = await updateRecordAction({
      id: updatedRecord.id,
      payload,
    });

    if (!result.ok) {
      showTemporaryMessage(`${labels.saveError}: ${result.error}`, "error");
      revertChangedCell(event);
      restartEditingCell(event);
      return;
    }

    const updatedRows = sortRows(
      rowDataRef.current.map((row) =>
        row.id === updatedRecord.id ? result.data.record : row
      )
    );

    setRows(updatedRows);
    onRowsChange?.(cleanRowsForParent(updatedRows));

    showTemporaryMessage(labels.changeSaved);
  }

  async function handleCellValueChanged(event: CellValueChangedEvent<TRecord>) {
    if (event.newValue === event.oldValue) {
      return;
    }

    if (event.data.is_new) {
      setRows(
        rowDataRef.current.map((row) =>
          row.id === newRowId ? event.data : row
        )
      );

      if (!newRowHasUserChanges(event.data)) {
        return;
      }

      const partialValidationMessage = validatePartialNewRow?.(event.data);

      if (partialValidationMessage) {
        showTemporaryMessage(partialValidationMessage, "error");
        return;
      }

      if (!isNewRowReadyToCreate(event.data)) {
        return;
      }

      if (newRowCreateMode === "onRowLeave") {
        return;
      }

      await createRecordFromNewRow(event.data, event);
      return;
    }

    const validationMessage = validateRow(event.data, false);

    if (validationMessage) {
      showTemporaryMessage(validationMessage, "error");
      revertChangedCell(event);
      restartEditingCell(event);
      return;
    }

    await updateExistingRecord(event);
  }

  async function handleCellFocused(event: CellFocusedEvent<TRecord>) {
    const nextFocusedRow =
      event.rowIndex === null || event.rowIndex === undefined
        ? null
        : event.api.getDisplayedRowAtIndex(event.rowIndex)?.data ?? null;

    const nextFocusedRowId = nextFocusedRow?.id ?? null;
    const previousFocusedRowId = lastFocusedRowIdRef.current;

    if (nextFocusedRowId !== null) {
      lastFocusedRowIdRef.current = nextFocusedRowId;
    }

    if (newRowCreateMode !== "onRowLeave") {
      return;
    }

    if (nextFocusedRowId === null) {
      return;
    }

    if (previousFocusedRowId !== newRowId || nextFocusedRowId === newRowId) {
      return;
    }

    await tryCreateNewRowOnLeave();
  }

  function handleGridBlur() {
    if (newRowCreateMode !== "onRowLeave") {
      return;
    }

    window.setTimeout(() => {
      const activeElement = document.activeElement;
      const container = gridContainerRef.current;

      if (container && activeElement && container.contains(activeElement)) {
        return;
      }

      void tryCreateNewRowOnLeave();
    }, 0);
  }

  async function deleteSelectedRecords() {
    const selectedRows =
      gridRef.current?.api.getSelectedRows().filter((row) => !row.is_new) ?? [];

    if (selectedRows.length === 0) {
      showTemporaryMessage(labels.selectAtLeastOneToDelete, "error");
      return;
    }

    const confirmed = window.confirm(
      labels.confirmDelete.replace("{count}", String(selectedRows.length))
    );

    if (!confirmed) {
      return;
    }

    const selectedIds = selectedRows.map((row) => row.id);
    const result = await deleteRecordsAction(selectedIds);

    if (!result.ok) {
      showTemporaryMessage(`${labels.deleteError}: ${result.error}`, "error");
      return;
    }

    if (result.data.ids.length === 0) {
      showTemporaryMessage(labels.noRowsDeleted, "error");
      return;
    }

    const remainingRows = rowDataRef.current.filter(
      (row) => !result.data.ids.includes(row.id)
    );

    setRows(remainingRows);
    onRowsChange?.(cleanRowsForParent(remainingRows));

    setSelectedCount(0);

    showTemporaryMessage(deletedMessage);
  }

  return (
    <div>
      <div className="sticky top-[168px] z-[80] -mx-4 mb-1 flex flex-wrap items-center gap-2 bg-app px-4 pb-1 pt-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {backButton}

        <button
          type="button"
          onClick={deleteSelectedRecords}
          disabled={selectedCount === 0}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {labels.deleteSelected}
        </button>

        {selectedCount > 0 && (
          <span className="text-xs text-app-muted">
            {selectedCount} {labels.selectedSuffix}
          </span>
        )}
      </div>

      {message && (
        <div
          className={[
            "mb-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
            message.variant === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-app bg-app-soft text-app-muted",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {message.text}
        </div>
      )}

      <div
        ref={gridContainerRef}
        onBlur={handleGridBlur}
        className={`ag-theme-quartz ${heightClass} w-full overflow-hidden rounded-xl border border-app-border`}
      >
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          rowData={rowData}
          columnDefs={columns}
          rowSelection={{
            mode: "multiRow",
            checkboxes: true,
            headerCheckbox: true,
            enableClickSelection: false,
          }}
          onSelectionChanged={handleSelectionChanged}
          onCellFocused={handleCellFocused}
          onCellValueChanged={handleCellValueChanged}
          stopEditingWhenCellsLoseFocus
          defaultColDef={{
            sortable: true,
            resizable: true,
            filter: true,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-app-muted">{labels.helpText}</p>
    </div>
  );
}
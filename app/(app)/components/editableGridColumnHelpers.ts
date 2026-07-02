import type {
  CellClassParams,
  ColDef,
  ValueSetterParams,
} from "ag-grid-community";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";

import AgGridAutocompleteCellEditor from "./AgGridAutocompleteCellEditor";
import type { EditableGridRecord } from "./EditableEntityGrid";

import { getFieldOptionLabel } from "@/lib/entityFields/helpers";

export type EditableGridColumnLayout = {
  flex?: number;
  minWidth?: number;
};

type EditableGridColumnBaseParams = {
  field: EntityFieldDefinition;
  headerName: string;
  flex?: number;
  minWidth?: number;
};

type EditableTextGridColumnParams = EditableGridColumnBaseParams & {
  valueFieldName?: string;
};

type EditableBooleanGridColumnParams = EditableGridColumnBaseParams & {
  yesLabel: string;
  noLabel: string;
};

type EditableOptionGridColumnParams = EditableGridColumnBaseParams & {
  fieldLabels: Record<string, string>;
};

type EditableAutocompleteGridColumnParams = EditableGridColumnBaseParams & {
  displayFieldName: string;
  optionLabels: readonly string[];
};

type EditableGridColumnBuilderParams = {
  field: EntityFieldDefinition;
  headerName: string;
  layout: EditableGridColumnLayout;
};

type EditableGridCustomColumnBuilder<TRecord extends EditableGridRecord> = (
  params: EditableGridColumnBuilderParams
) => ColDef<TRecord>;

type BuildEditableGridColumnsParams<TRecord extends EditableGridRecord> = {
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  getColumnLayout?: (field: EntityFieldDefinition) => EditableGridColumnLayout;
  booleanLabels?: {
    yesLabel: string;
    noLabel: string;
  };
  customColumnBuilders?: Partial<
    Record<string, EditableGridCustomColumnBuilder<TRecord>>
  >;
};

function getEditableGridCellClass<TRecord extends EditableGridRecord>(
  params: CellClassParams<TRecord>
) {
  return params.data?.is_new ? "bg-[var(--color-bg-soft)] font-medium" : "";
}

function normalizeTextGridValue(
  field: EntityFieldDefinition,
  value: unknown
): string | null {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  if (field.normalization === "uppercase") {
    return text.toUpperCase();
  }

  return text;
}

function normalizeBooleanGridValue(value: unknown, yesLabel: string) {
  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  const normalizedYesLabel = yesLabel.trim().toLowerCase();

  return (
    text === "true" ||
    text === "sí" ||
    text === "si" ||
    text === "yes" ||
    text === "1" ||
    text === normalizedYesLabel
  );
}

function getOptionLabel({
  field,
  fieldLabels,
  value,
}: {
  field: EntityFieldDefinition;
  fieldLabels: Record<string, string>;
  value: unknown;
}) {
  return getFieldOptionLabel({
    field,
    value,
    fieldLabels,
  });
}

function normalizeOptionGridValue({
  field,
  fieldLabels,
  value,
}: {
  field: EntityFieldDefinition;
  fieldLabels: Record<string, string>;
  value: unknown;
}) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const optionByValue = field.options?.find((option) => option.value === text);

  if (optionByValue) {
    return optionByValue.value;
  }

  const normalizedText = text.toLowerCase();
  const optionByLabel = field.options?.find((option) => {
    const label = fieldLabels[option.labelKey] ?? option.labelKey;

    return label.trim().toLowerCase() === normalizedText;
  });

  return optionByLabel?.value ?? text;
}

function setGridCellValue<TRecord extends EditableGridRecord>(
  params: ValueSetterParams<TRecord>,
  fieldName: string,
  value: unknown
) {
  if (!params.data) {
    return false;
  }

  const row = params.data as EditableGridRecord;

  if (value === row[fieldName]) {
    return false;
  }

  row[fieldName] = value;
  return true;
}

export function buildEditableTextGridColumn<
  TRecord extends EditableGridRecord
>({
  field,
  headerName,
  flex = 1,
  minWidth = 130,
  valueFieldName = field.dbName,
}: EditableTextGridColumnParams): ColDef<TRecord> {
  return {
    field: valueFieldName as ColDef<TRecord>["field"],
    headerName,
    editable: true,
    flex,
    minWidth,
    cellClass: getEditableGridCellClass,
    valueSetter: (params) =>
      setGridCellValue(
        params,
        valueFieldName,
        normalizeTextGridValue(field, params.newValue)
      ),
  };
}

export function buildEditableBooleanGridColumn<
  TRecord extends EditableGridRecord
>({
  field,
  headerName,
  flex = 1,
  minWidth = 120,
  yesLabel,
  noLabel,
}: EditableBooleanGridColumnParams): ColDef<TRecord> {
  return {
    field: field.dbName as ColDef<TRecord>["field"],
    headerName,
    editable: true,
    flex,
    minWidth,
    cellClass: getEditableGridCellClass,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: {
      values: [true, false],
    },
    valueFormatter: (params) => (params.value ? yesLabel : noLabel),
    valueSetter: (params) =>
      setGridCellValue(
        params,
        field.dbName,
        normalizeBooleanGridValue(params.newValue, yesLabel)
      ),
  };
}

export function buildEditableOptionGridColumn<
  TRecord extends EditableGridRecord
>({
  field,
  fieldLabels,
  headerName,
  flex = 1,
  minWidth = 150,
}: EditableOptionGridColumnParams): ColDef<TRecord> {
  const optionValues = field.options?.map((option) => option.value) ?? [];

  return {
    field: field.dbName as ColDef<TRecord>["field"],
    headerName,
    editable: true,
    flex,
    minWidth,
    cellClass: getEditableGridCellClass,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: {
      values: optionValues,
    },
    valueFormatter: (params) =>
      getOptionLabel({
        field,
        fieldLabels,
        value: params.value,
      }),
    valueSetter: (params) =>
      setGridCellValue(
        params,
        field.dbName,
        normalizeOptionGridValue({
          field,
          fieldLabels,
          value: params.newValue,
        })
      ),
  };
}

export function buildEditableAutocompleteGridColumn<
  TRecord extends EditableGridRecord
>({
  field,
  headerName,
  displayFieldName,
  optionLabels,
  flex = 1,
  minWidth = 240,
}: EditableAutocompleteGridColumnParams): ColDef<TRecord> {
  return {
    field: displayFieldName as ColDef<TRecord>["field"],
    headerName,
    editable: true,
    flex,
    minWidth,
    cellClass: getEditableGridCellClass,
    cellEditor: AgGridAutocompleteCellEditor,
    cellEditorParams: {
      options: optionLabels,
    },
    valueGetter: (params) => String(params.data?.[displayFieldName] ?? ""),
    valueSetter: (params) =>
      setGridCellValue(
        params,
        displayFieldName,
        normalizeTextGridValue(field, params.newValue)
      ),
  };
}

export function buildEditableGridColumns<
  TRecord extends EditableGridRecord
>({
  fields,
  fieldLabels,
  getFieldLabel,
  getColumnLayout = () => ({}),
  booleanLabels,
  customColumnBuilders,
}: BuildEditableGridColumnsParams<TRecord>): ColDef<TRecord>[] {
  return fields.map((field) => {
    const headerName = getFieldLabel(fieldLabels, field);
    const layout = getColumnLayout(field);
    const customColumnBuilder = customColumnBuilders?.[field.dbName];

    if (customColumnBuilder) {
      return customColumnBuilder({
        field,
        headerName,
        layout,
      });
    }

    if (field.type === "boolean") {
      return buildEditableBooleanGridColumn<TRecord>({
        field,
        headerName,
        yesLabel: booleanLabels?.yesLabel ?? "true",
        noLabel: booleanLabels?.noLabel ?? "false",
        ...layout,
      });
    }

        if (field.type === "option") {
      return buildEditableOptionGridColumn<TRecord>({
        field,
        fieldLabels,
        headerName,
        ...layout,
      });
    }

    return buildEditableTextGridColumn<TRecord>({
      field,
      headerName,
      ...layout,
    });
  });
}
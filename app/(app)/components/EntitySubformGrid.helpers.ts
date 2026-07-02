import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityRecord,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import { formatFieldValueForInput } from "@/lib/formatters/fieldFormatters";

export function getGridFields(subform: EntitySubformDefinition) {
  return subform.fields.filter((field) => field.showInGrid);
}

export function getFieldLabel(
  fieldLabels: Record<string, string>,
  field: EntityFieldDefinition
) {
  return fieldLabels[field.dbName] ?? fieldLabels[field.key] ?? field.labelKey;
}

export function getNewRowDefaultValue(field: EntityFieldDefinition) {
  if (
    field.newRowDefaultValue === null ||
    field.newRowDefaultValue === undefined
  ) {
    return "";
  }

  return String(field.newRowDefaultValue);
}

export function createEmptyDraft(fields: readonly EntityFieldDefinition[]) {
  return fields.reduce<Record<string, string>>((draft, field) => {
    draft[field.dbName] = getNewRowDefaultValue(field);
    return draft;
  }, {});
}

export function createDraftFromRecord(
  fields: readonly EntityFieldDefinition[],
  record: EntityRecord
) {
  return fields.reduce<Record<string, string>>((draft, field) => {
    draft[field.dbName] = formatFieldValueForInput(
      field,
      record[field.dbName] ?? ""
    );

    return draft;
  }, {});
}

export function getInputMode(field: EntityFieldDefinition) {
  if (field.type === "decimal") {
    return "decimal";
  }

  if (field.type === "integer") {
    return "numeric";
  }

  return undefined;
}

export function isMeaningfulDraftValue(
  field: EntityFieldDefinition,
  value: string | undefined
) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return false;
  }

  const defaultValue = getNewRowDefaultValue(field).trim();

  if (defaultValue && trimmedValue === defaultValue) {
    return false;
  }

  return true;
}

export function hasAnyEditableValue(
  fields: readonly EntityFieldDefinition[],
  values: Record<string, string>
) {
  return fields.some((field) =>
    isMeaningfulDraftValue(field, values[field.dbName])
  );
}

export function hasValuesUntilFieldIndex({
  fields,
  values,
  fieldIndex,
}: {
  fields: readonly EntityFieldDefinition[];
  values: Record<string, string>;
  fieldIndex: number;
}) {
  return fields.slice(0, fieldIndex + 1).every((field) => {
    if (field.editable === false) {
      return true;
    }

    const value = values[field.dbName]?.trim() ?? "";
    const defaultValue = getNewRowDefaultValue(field).trim();

    if (value) {
      return true;
    }

    return Boolean(defaultValue);
  });
}

export function getSubformColumnClassName(field: EntityFieldDefinition) {
  switch (field.grid?.width) {
    case "xs":
      return "w-20 min-w-20";
    case "sm":
      return "w-24 min-w-24";
    case "md":
      return "w-28 min-w-28";
    case "lg":
      return "w-36 min-w-36";
    case "xl":
      return "w-48 min-w-48";
    default:
      return field.type === "decimal" ? "w-24 min-w-24" : "w-40 min-w-40";
  }
}

export function getSubformAlignmentClassName(field: EntityFieldDefinition) {
  const align = field.grid?.align ?? (field.type === "decimal" ? "right" : "left");

  if (align === "center") {
    return "text-center";
  }

  if (align === "right") {
    return "text-right";
  }

  return "text-left";
}

export function getSubformInputClassName({
  field,
  error,
}: {
  field: EntityFieldDefinition;
  error: string | null;
}) {
  return [
    "input-app h-8 w-full px-2 py-1 text-sm",
    getSubformAlignmentClassName(field),
    field.editable === false ? "cursor-not-allowed bg-app-soft text-app-muted" : "",
    field.calculated ? "font-semibold" : "",
    error ? "border-red-500 text-red-700 outline-red-500" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
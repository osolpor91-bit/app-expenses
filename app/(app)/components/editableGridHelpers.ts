import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import { validateFieldsByDefinitions } from "@/lib/validation/fieldValidationRegistry";

import type { EditableGridRecord } from "./EditableEntityGrid";

export type EditableGridPayload = Record<string, string | boolean | null>;

type CreateEmptyGridRowParams = {
  tenantId: string;
  newRowId: string;
  fields: readonly EntityFieldDefinition[];
  extraValues?: Record<string, unknown>;
};

type CleanGridRowsParams<TRecord extends EditableGridRecord> = {
  rows: TRecord[];
  fields: readonly EntityFieldDefinition[];
  extraFields?: readonly string[];
};

type ValidateGridPayloadParams = {
  fields: readonly EntityFieldDefinition[];
  payload: EditableGridPayload;
  validationMessages: Record<string, unknown>;
};

type EditableGridSortDefinition = {
  fieldName: string;
  direction?: "asc" | "desc";
};

function compareGridTextValues(a: unknown, b: unknown) {
  return String(a ?? "").localeCompare(String(b ?? ""), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortGridRowsByTextFields<TRecord extends EditableGridRecord>(
  rows: TRecord[],
  sortBy: readonly EditableGridSortDefinition[]
) {
  return [...rows].sort((a, b) => {
    for (const sort of sortBy) {
      const directionMultiplier = sort.direction === "desc" ? -1 : 1;
      const comparison =
        compareGridTextValues(a[sort.fieldName], b[sort.fieldName]) *
        directionMultiplier;

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  });
}

export function sortGridRowsByTextField<TRecord extends EditableGridRecord>(
  rows: TRecord[],
  fieldName: string
) {
  return sortGridRowsByTextFields(rows, [
    {
      fieldName,
    },
  ]);
}

function getEmptyGridFieldValue(field: EntityFieldDefinition) {
  if (field.newRowDefaultValue !== undefined) {
    return field.newRowDefaultValue;
  }

  if (field.type === "boolean") {
    return false;
  }

  return "";
}

export function createEmptyGridRow<TRecord extends EditableGridRecord>({
  tenantId,
  newRowId,
  fields,
  extraValues = {},
}: CreateEmptyGridRowParams): TRecord {
  const row: EditableGridRecord = {
    id: newRowId,
    tenant_id: tenantId,
    is_new: true,
    ...extraValues,
  };

  fields.forEach((field) => {
    row[field.dbName] = getEmptyGridFieldValue(field);
  });

  return row as TRecord;
}

export function cleanGridRowsForParent<TRecord extends EditableGridRecord>({
  rows,
  fields,
  extraFields = [],
}: CleanGridRowsParams<TRecord>) {
  return rows
    .filter((row) => !row.is_new)
    .map((row) => {
      const cleanRow: EditableGridRecord = {
        id: row.id,
        tenant_id: row.tenant_id,
      };

      fields.forEach((field) => {
        cleanRow[field.dbName] = row[field.dbName];
      });

      extraFields.forEach((fieldName) => {
        cleanRow[fieldName] = row[fieldName];
      });

      return cleanRow as TRecord;
    });
}

export function buildBasicGridPayload<TRecord extends EditableGridRecord>(
  fields: readonly EntityFieldDefinition[],
  row: TRecord
): EditableGridPayload {
  const payload: EditableGridPayload = {};

  fields.forEach((field) => {
    if (field.type === "boolean") {
      payload[field.dbName] = Boolean(row[field.dbName]);
      return;
    }

    const value = String(row[field.dbName] ?? "").trim();
    payload[field.dbName] = value || null;
  });

  return payload;
}

export function hasRequiredGridValues<TRecord extends EditableGridRecord>(
  fields: readonly EntityFieldDefinition[],
  row: TRecord
) {
  return fields
    .filter((field) => field.required)
    .every((field) => String(row[field.dbName] ?? "").trim());
}

export function validateGridPayload({
  fields,
  payload,
  validationMessages,
}: ValidateGridPayloadParams) {
  const validationResult = validateFieldsByDefinitions(
    fields,
    payload,
    validationMessages
  );

  return validationResult.error;
}
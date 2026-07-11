import type { EntityFieldDefinition } from "./types";

type EntityPayloadValue = string | boolean | null | undefined;

export function getDbColumnsFromFields(
  fields: readonly EntityFieldDefinition[],
  extraColumns: string[] = []
) {
  const fieldColumns = fields.map((field) => field.dbName);
  const uniqueColumns = Array.from(new Set([...extraColumns, ...fieldColumns]));

  return uniqueColumns.join(", ");
}

export function getFieldsForList<TField extends EntityFieldDefinition>(
  fields: readonly TField[]
) {
  return fields.filter((field) => field.showInList);
}

export function getFieldsForForm<TField extends EntityFieldDefinition>(
  fields: readonly TField[]
) {
  return fields.filter((field) => field.showInForm);
}

export function getFieldsForGrid<TField extends EntityFieldDefinition>(
  fields: readonly TField[]
) {
  return fields.filter((field) => field.showInGrid);
}

export function getFieldsForFactBox<TField extends EntityFieldDefinition>(
  fields: readonly TField[]
) {
  return fields.filter((field) => field.showInFactBox);
}

export function getFieldLabels(
  fields: readonly EntityFieldDefinition[],
  labelsSource: Record<string, unknown>,
  fallbackLabelsSource: Record<string, unknown> = {}
): Record<string, string> {
  return fields.reduce<Record<string, string>>((labels, field) => {
    const value =
      labelsSource[field.labelKey] ?? fallbackLabelsSource[field.labelKey];

    labels[field.labelKey] =
      typeof value === "string" ? value : field.labelKey;

    field.options?.forEach((option) => {
      const optionValue =
        labelsSource[option.labelKey] ?? fallbackLabelsSource[option.labelKey];

      labels[option.labelKey] =
        typeof optionValue === "string" ? optionValue : option.labelKey;
    });

    return labels;
  }, {});
}

export function getFieldLabelsByDbName(
  fields: readonly EntityFieldDefinition[],
  labelsSource: Record<string, unknown>,
  fallbackLabelsSource: Record<string, unknown> = {}
): Record<string, string> {
  return fields.reduce<Record<string, string>>((labels, field) => {
    const value =
      labelsSource[field.labelKey] ?? fallbackLabelsSource[field.labelKey];

    labels[field.dbName] =
      typeof value === "string" ? value : field.labelKey;

    return labels;
  }, {});
}

export function getFieldLabel(
  fieldLabels: Record<string, string>,
  field: EntityFieldDefinition
) {
  return fieldLabels[field.labelKey] ?? field.labelKey;
}

export function getFieldOptionLabel({
  field,
  value,
  fieldLabels,
}: {
  field: EntityFieldDefinition;
  value: unknown;
  fieldLabels: Record<string, string>;
}) {
  const rawValue = value === null || value === undefined ? "" : String(value);
  const option = field.options?.find(
    (currentOption) => currentOption.value === rawValue
  );

  if (!option) {
    return rawValue || "-";
  }

  return fieldLabels[option.labelKey] ?? option.labelKey;
}

export function isValidFieldOptionValue({
  field,
  value,
}: {
  field: EntityFieldDefinition;
  value: string;
}) {
  if (field.type !== "option") {
    return true;
  }

  return Boolean(field.options?.some((option) => option.value === value));
}

export function getTextInputType(field: EntityFieldDefinition) {
  if (field.type === "email") {
    return "email";
  }

  if (field.type === "tel") {
    return "tel";
  }

  if (field.type === "date") {
    return "date";
  }

  if (field.type === "datetime") {
    return "datetime-local";
  }

  return "text";
}

export function getEditableFields(fields: readonly EntityFieldDefinition[]) {
  return fields.filter((field) => field.editable !== false);
}

export function getEditableDbNames(fields: readonly EntityFieldDefinition[]) {
  return getEditableFields(fields).map((field) => field.dbName);
}

export function findFieldByDbName(
  fields: readonly EntityFieldDefinition[],
  dbName: string
) {
  return fields.find((field) => field.dbName === dbName) ?? null;
}

function shouldStoreEmptyString(field: EntityFieldDefinition) {
  return field.type === "option";
}

export function buildEntityPayloadFromFields(
  fields: readonly EntityFieldDefinition[],
  values: Record<string, EntityPayloadValue>,
  baseValues: Record<string, string>
): Record<string, string | boolean | null> {
  const payload: Record<string, string | boolean | null> = {
    ...baseValues,
  };

  getEditableFields(fields).forEach((field) => {
    const value = values[field.dbName];

    if (value === null || value === undefined) {
      payload[field.dbName] = shouldStoreEmptyString(field) ? "" : null;
      return;
    }

    if (value === "") {
      payload[field.dbName] = shouldStoreEmptyString(field) ? "" : null;
      return;
    }

    if (typeof value === "boolean") {
      payload[field.dbName] = value;
      return;
    }

    payload[field.dbName] = String(value);
  });

  return payload;
}

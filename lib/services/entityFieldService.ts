import {
  findFieldByDbName,
  getEditableFields,
} from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import {
  validateFieldByDefinition,
  type FieldValidationMessages,
} from "@/lib/validation/fieldValidationRegistry";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

export type EntityServiceLabels = {
  fieldRequired: string;
  fieldLabelsByDbName: Record<string, string>;
  validationMessages: FieldValidationMessages;
};

export type EntityFieldInputValue = string | boolean | null | undefined;
export type EntityNormalizedFieldValue = string | boolean | null;
export type EntityValuesInput = Record<string, EntityFieldInputValue>;
export type EntityNormalizedValues = Record<string, EntityNormalizedFieldValue>;

type ValidateEntityFieldParams = {
  fields: readonly EntityFieldDefinition[];
  fieldName: string;
  value: EntityFieldInputValue;
  labels: EntityServiceLabels;
};

type NormalizeEntityValuesParams = {
  fields: readonly EntityFieldDefinition[];
  values: EntityValuesInput;
  labels: EntityServiceLabels;
};

function getRequiredFieldMessage(
  fieldName: string,
  labels: EntityServiceLabels
) {
  const fieldLabel = labels.fieldLabelsByDbName[fieldName] ?? fieldName;
  return labels.fieldRequired.replace("{field}", fieldLabel);
}

function normalizeBooleanValue(value: EntityFieldInputValue): boolean {
  return value === true || value === "true";
}

function normalizeEmptyValueForField(
  field: EntityFieldDefinition,
  value: string
): string | null {
  if (value !== "") {
    return value;
  }

  if (field.type === "option") {
    return "";
  }

  return null;
}

export function validateEntityField({
  fields,
  fieldName,
  value,
  labels,
}: ValidateEntityFieldParams): EntityOperationResult<{
  fieldName: string;
  value: EntityNormalizedFieldValue;
}> {
  const field = findFieldByDbName(fields, fieldName);

  if (!field || field.editable === false) {
    return entityOperationError(`El campo ${fieldName} no se puede modificar.`);
  }

  if (field.type === "boolean") {
    return entityOperationOk({
      fieldName,
      value: normalizeBooleanValue(value),
    });
  }

  const validationResult = validateFieldByDefinition(
    field,
    String(value ?? ""),
    labels.validationMessages
  );

  if (validationResult.error) {
    return entityOperationError(validationResult.error);
  }

  if (field.required && !validationResult.value) {
    return entityOperationError(getRequiredFieldMessage(fieldName, labels));
  }

  return entityOperationOk({
    fieldName,
    value: normalizeEmptyValueForField(field, validationResult.value),
  });
}

export function normalizeEntityValues({
  fields,
  values,
  labels,
}: NormalizeEntityValuesParams): EntityOperationResult<EntityNormalizedValues> {
  const normalizedValues: EntityNormalizedValues = {};

  for (const field of getEditableFields(fields)) {
    const validationResult = validateEntityField({
      fields,
      fieldName: field.dbName,
      value: values[field.dbName],
      labels,
    });

    if (!validationResult.ok) {
      return validationResult;
    }

    normalizedValues[field.dbName] = validationResult.data.value;
  }

  return entityOperationOk(normalizedValues);
}
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type {
  EntityFieldDefinition,
  EntityFieldOptionDefinition,
} from "@/lib/entityFields/types";
import type {
  EntityFormFieldPlacement,
  EntityFormLayoutDefinition,
} from "@/lib/entities/core/entityDefinition";
import type { PurchaseLineSourceOptionsByType } from "@/lib/purchaseLines/purchaseLineLookups";
import { formatFieldValueForInput } from "@/lib/formatters/fieldFormatters";
import type { EntityOperationResult } from "@/lib/services/entityService";
import type { FieldValidator } from "@/lib/validation/fieldValidations";

import AutocompleteInput from "./AutocompleteInput";
import EntityFormLayoutRenderer from "./EntityFormLayoutRenderer";

type SelectOptionValue = string | number | boolean | null;

type SelectOption = {
  value: string;
  label: string;
  menuLabel?: string;
  searchLabel?: string;
  values?: Record<string, SelectOptionValue>;
};

type EntityFormContextValues = {
  activeCompanyCurrencyCode?: string | null;
};

export type EntityAutoSaveFormData = {
  id?: string;
  tenant_id?: string;
  company_id?: string;
  [key: string]: string | boolean | number | null | undefined;
};

type EntityAutoSaveFormLabels = {
  fieldRequired: string;
  save: string;
  saving: string;
  cancel: string;
  createError: string;
  saveError: string;
  noRecordId: string;
  recordSaved: string;
  autoCreateHint?: string;
};

type CreateRecordAction = (
  values: Record<string, string>
) => Promise<EntityOperationResult<{ id: string }>>;

type UpdateRecordFieldAction = (input: {
  id: string;
  fieldName: string;
  value: string;
}) => Promise<EntityOperationResult<{ value: string | boolean | null }>>;

type EntityAutoSaveFormProps = {
  mode: "create" | "edit";
  record?: EntityAutoSaveFormData;
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  formLayout?: EntityFormLayoutDefinition;
  formLayoutLabels?: Record<string, string>;
  formContextValues?: EntityFormContextValues;
  labels: EntityAutoSaveFormLabels;
  cancelHref: string;
  selectOptionsByField?: Record<string, SelectOption[]>;
  purchaseLineSourceOptionsByType?: PurchaseLineSourceOptionsByType | null;
  emptySelectLabelsByField?: Record<string, string>;
  fieldValidators?: Record<string, FieldValidator>;
  createRecordAction: CreateRecordAction;
  updateRecordFieldAction: UpdateRecordFieldAction;
  getFieldLabel: (
    fieldLabels: Record<string, string>,
    field: EntityFieldDefinition
  ) => string;
  redirectToRecord: (id: string) => string;
};

function parseBooleanFieldValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes" ||
    normalizedValue === "si" ||
    normalizedValue === "sí"
  );
}

function getInitialFormFieldValue(
  field: EntityFieldDefinition,
  value: unknown
) {
  if (field.type === "boolean") {
    return parseBooleanFieldValue(value) ? "true" : "false";
  }

  return formatFieldValueForInput(field, value ?? "");
}

function createInitialFormData(
  fields: readonly EntityFieldDefinition[],
  record?: EntityAutoSaveFormData
) {
  return fields.reduce<Record<string, string>>((formData, field) => {
    const rawValue =
      record?.[field.dbName] ??
      (record ? undefined : field.newRowDefaultValue);

    formData[field.dbName] = getInitialFormFieldValue(field, rawValue);

    return formData;
  }, {});
}

function getInputType(field: EntityFieldDefinition) {
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

function getInputMode(field: EntityFieldDefinition) {
  if (field.type === "decimal") {
    return "decimal";
  }

  if (field.type === "integer") {
    return "numeric";
  }

  return undefined;
}

function isFieldEditable(field: EntityFieldDefinition) {
  return field.editable !== false;
}

function isFieldCalculated(field: EntityFieldDefinition) {
  return field.calculated === true;
}

function getOptionLabel({
  option,
  fieldLabels,
}: {
  option: EntityFieldOptionDefinition;
  fieldLabels: Record<string, string>;
}) {
  return fieldLabels[option.labelKey] ?? option.labelKey;
}

function formatFormDataForInput(
  fields: readonly EntityFieldDefinition[],
  data: Record<string, unknown>
) {
  return fields.reduce<Record<string, string>>((formattedData, field) => {
    formattedData[field.dbName] = getInitialFormFieldValue(
      field,
      data[field.dbName]
    );

    return formattedData;
  }, {});
}

function hasAnyValue(data: Record<string, string>) {
  return Object.values(data).some((value) => String(value ?? "").trim() !== "");
}

function getWritableFormData({
  fields,
  data,
}: {
  fields: readonly EntityFieldDefinition[];
  data: Record<string, string>;
}) {
  return fields.reduce<Record<string, string>>((writableData, field) => {
    if (!isFieldEditable(field)) {
      return writableData;
    }

    writableData[field.dbName] = data[field.dbName] ?? "";
    return writableData;
  }, {});
}

export default function EntityAutoSaveForm({
  mode,
  record,
  fields,
  fieldLabels,
  formLayout,
  formLayoutLabels,
  formContextValues = {},
  labels,
  cancelHref,
  selectOptionsByField = {},
  purchaseLineSourceOptionsByType = null,
  emptySelectLabelsByField = {},
  fieldValidators = {},
  createRecordAction,
  updateRecordFieldAction,
  getFieldLabel,
  redirectToRecord,
}: EntityAutoSaveFormProps) {
  const router = useRouter();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const hasCreatedRecordRef = useRef(false);

  const initialFormData = createInitialFormData(fields, record);

  const [formData, setFormData] = useState<Record<string, string>>(
    initialFormData
  );

  const [savedFormData, setSavedFormData] =
    useState<Record<string, string>>(initialFormData);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {}
  );

  const [message, setMessage] = useState<string | null>(
    mode === "create"
      ? labels.autoCreateHint ??
      "Completa los campos obligatorios para crear el registro automáticamente."
      : null
  );

  const [isCreating, setIsCreating] = useState(false);
  const [savingFieldName, setSavingFieldName] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !record) {
      return;
    }

    const nextInitialFormData = createInitialFormData(fields, record);
    const readOnlyFields = fields.filter((field) => !isFieldEditable(field));

    if (readOnlyFields.length === 0) {
      return;
    }

    setFormData((currentFormData) => {
      let hasChanges = false;
      const nextFormData = { ...currentFormData };

      readOnlyFields.forEach((field) => {
        const nextValue = nextInitialFormData[field.dbName] ?? "";

        if (nextFormData[field.dbName] !== nextValue) {
          nextFormData[field.dbName] = nextValue;
          hasChanges = true;
        }
      });

      return hasChanges ? nextFormData : currentFormData;
    });

    setSavedFormData((currentSavedFormData) => {
      let hasChanges = false;
      const nextSavedFormData = { ...currentSavedFormData };

      readOnlyFields.forEach((field) => {
        const nextValue = nextInitialFormData[field.dbName] ?? "";

        if (nextSavedFormData[field.dbName] !== nextValue) {
          nextSavedFormData[field.dbName] = nextValue;
          hasChanges = true;
        }
      });

      return hasChanges ? nextSavedFormData : currentSavedFormData;
    });
  }, [fields, mode, record]);

  function getRequiredFields(data: Record<string, string>) {
    return fields.filter(
      (field) =>
        field.required && isFieldEditable(field) && isFieldVisibleInForm(field, data)
    );
  }

  function getFirstMissingRequiredField(data: Record<string, string>) {
    return getRequiredFields(data).find((field) => {
      return !String(data[field.dbName] ?? "").trim();
    });
  }

  function areRequiredFieldsReady(data: Record<string, string>) {
    const requiredFields = getRequiredFields(data);

    if (requiredFields.length === 0) {
      return hasAnyValue(data);
    }

    return requiredFields.every((field) =>
      String(data[field.dbName] ?? "").trim()
    );
  }

  function updateField(field: EntityFieldDefinition, value: string) {
    const nextFormData = {
      ...formData,
      [field.dbName]: value,
    };

    setFormData(nextFormData);

    setFieldErrors((currentFieldErrors) => ({
      ...currentFieldErrors,
      [field.dbName]: null,
    }));

    const input = inputRefs.current[field.dbName];

    if (input) {
      input.setCustomValidity("");
    }

    return nextFormData;
  }

  function getDynamicSelectOptions(field: EntityFieldDefinition) {
    const dynamicSelectOptions = field.dynamicSelectOptions;

    if (dynamicSelectOptions?.source !== "purchaseLineSources") {
      return null;
    }

    const sourceType =
      formData[dynamicSelectOptions.dependsOnDbName] === "account"
        ? "account"
        : "item";

    return (
      purchaseLineSourceOptionsByType?.[sourceType]?.map((option) => {
        const code =
          String(option.values?.code ?? "").trim() || option.label.trim();
        const description = String(option.values?.description ?? "").trim();
        const menuLabel = [code, description].filter(Boolean).join(" - ");
        const searchLabel = [code, description].filter(Boolean).join(" ");

        return {
          value: option.id,
          label: code || option.label,
          menuLabel: menuLabel || option.label,
          searchLabel: searchLabel || option.label,
          values: option.values,
        };
      }) ?? []
    );
  }

  function applyResetFieldValues({
    changedField,
    data,
  }: {
    changedField: EntityFieldDefinition;
    data: Record<string, string>;
  }) {
    const resetFieldDbNames = changedField.resetFieldDbNamesOnChange ?? [];

    if (resetFieldDbNames.length === 0) {
      return {
        data,
        changedFields: [] as EntityFieldDefinition[],
      };
    }

    const nextData = { ...data };
    const changedFields: EntityFieldDefinition[] = [];

    resetFieldDbNames.forEach((fieldDbName) => {
      const fieldToReset = fields.find((field) => field.dbName === fieldDbName);

      if (!fieldToReset) {
        return;
      }

      if (String(nextData[fieldDbName] ?? "").trim() === "") {
        return;
      }

      nextData[fieldDbName] = "";
      changedFields.push(fieldToReset);
    });

    return {
      data: nextData,
      changedFields,
    };
  }

  function applyRelationDefaultValues({
    changedField,
    changedValue,
    data,
  }: {
    changedField: EntityFieldDefinition;
    changedValue: string;
    data: Record<string, string>;
  }) {
    const selectedOption = selectOptionsByField[changedField.dbName]?.find(
      (option) => option.value === changedValue
    );

    if (!selectedOption?.values) {
      return {
        data,
        changedFields: [] as EntityFieldDefinition[],
      };
    }

    return fields.reduce<{
      data: Record<string, string>;
      changedFields: EntityFieldDefinition[];
    }>(
      (result, targetField) => {
        const defaultDefinition = targetField.createDefaultValueFromRelation;

        if (!defaultDefinition) {
          return result;
        }

        if (defaultDefinition.relationFieldDbName !== changedField.dbName) {
          return result;
        }

        const sourceValue =
          selectedOption.values?.[defaultDefinition.sourceFieldDbName];

        if (sourceValue === undefined) {
          return result;
        }

        const currentTargetValue = String(
          result.data[targetField.dbName] ?? ""
        ).trim();

        if (
          defaultDefinition.overwrite !== "always" &&
          currentTargetValue !== ""
        ) {
          return result;
        }

        const nextTargetValue =
          sourceValue === null ? "" : String(sourceValue);

        if (currentTargetValue === nextTargetValue) {
          return result;
        }

        result.data[targetField.dbName] = nextTargetValue;
        result.changedFields.push(targetField);

        return result;
      },
      {
        data: { ...data },
        changedFields: [],
      }
    );
  }

  function setFieldError(field: EntityFieldDefinition, error: string) {
    setFieldErrors((currentFieldErrors) => ({
      ...currentFieldErrors,
      [field.dbName]: error,
    }));

    setMessage(error);

    const input = inputRefs.current[field.dbName];

    if (input) {
      input.setCustomValidity(error);
      input.reportValidity();

      window.setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }
  }

  function clearFieldError(field: EntityFieldDefinition) {
    setFieldErrors((currentFieldErrors) => ({
      ...currentFieldErrors,
      [field.dbName]: null,
    }));

    const input = inputRefs.current[field.dbName];

    if (input) {
      input.setCustomValidity("");
    }
  }

  function getRequiredFieldMessage(field: EntityFieldDefinition) {
    const fieldLabel = getFieldLabel(fieldLabels, field);
    return labels.fieldRequired.replace("{field}", fieldLabel);
  }

  function getFormContextValue(key: string) {
    if (key === "activeCompanyCurrencyCode") {
      return formContextValues.activeCompanyCurrencyCode ?? "";
    }

    return "";
  }

  function getConditionalVisibilityExpectedValue(field: EntityFieldDefinition) {
    const visibility = field.formVisibility;

    if (!visibility) {
      return "";
    }

    if (visibility.contextValueKey) {
      return getFormContextValue(visibility.contextValueKey);
    }

    return visibility.value ?? "";
  }

  function normalizeConditionalVisibilityValue(value: unknown) {
    return String(value ?? "").trim();
  }

  function isFieldVisibleInForm(
    field: EntityFieldDefinition,
    data: Record<string, string>
  ) {
    const visibility = field.formVisibility;

    if (!visibility) {
      return true;
    }

    const dependencyValue = normalizeConditionalVisibilityValue(
      data[visibility.dependsOnDbName]
    );

    if (visibility.hideWhenDependencyEmpty && !dependencyValue) {
      return false;
    }

    if (visibility.operator === "isEmpty") {
      return dependencyValue === "";
    }

    if (visibility.operator === "isNotEmpty") {
      return dependencyValue !== "";
    }

    const expectedValue = normalizeConditionalVisibilityValue(
      getConditionalVisibilityExpectedValue(field)
    );

    if (visibility.operator === "equals") {
      return dependencyValue === expectedValue;
    }

    if (visibility.operator === "notEquals") {
      return dependencyValue !== expectedValue;
    }

    return true;
  }

  function validateConfiguredFields(data: Record<string, string>) {
    const nextFormData = { ...data };

    for (const field of fields) {
      if (!isFieldEditable(field)) {
        continue;
      }

      const validator = fieldValidators[field.dbName];

      if (!validator) {
        continue;
      }

      const validationResult = validator(
        String(nextFormData[field.dbName] ?? "")
      );

      nextFormData[field.dbName] = validationResult.value;

      if (validationResult.error) {
        setFormData(formatFormDataForInput(fields, nextFormData));
        setFieldError(field, validationResult.error);
        return null;
      }

      clearFieldError(field);
    }

    setFormData(formatFormDataForInput(fields, nextFormData));
    return nextFormData;
  }

  function validateSingleField(field: EntityFieldDefinition, rawValue: string) {
    const validator = fieldValidators[field.dbName];

    if (!validator) {
      return {
        value: rawValue.trim(),
        error: null,
      };
    }

    return validator(rawValue);
  }

  async function tryCreateRecordAutomatically({
    data,
    showMissingRequiredError = false,
  }: {
    data: Record<string, string>;
    showMissingRequiredError?: boolean;
  }) {
    if (mode !== "create") {
      return false;
    }

    if (hasCreatedRecordRef.current || isCreating) {
      return false;
    }

    const validatedFormData = validateConfiguredFields(data);

    if (!validatedFormData) {
      return false;
    }

    if (!areRequiredFieldsReady(validatedFormData)) {
      const missingField = getFirstMissingRequiredField(validatedFormData);

      if (showMissingRequiredError && missingField) {
        setFieldError(missingField, getRequiredFieldMessage(missingField));
        return false;
      }

      setMessage(
        labels.autoCreateHint ??
        "Completa los campos obligatorios para crear el registro automáticamente."
      );

      return false;
    }

    hasCreatedRecordRef.current = true;
    setIsCreating(true);
    setMessage(labels.saving);

    const result = await createRecordAction(
      getWritableFormData({
        fields,
        data: validatedFormData,
      })
    );

    setIsCreating(false);

    if (!result.ok) {
      hasCreatedRecordRef.current = false;
      setMessage(`${labels.createError}: ${result.error}`);
      return false;
    }

    router.push(redirectToRecord(result.data.id));
    router.refresh();

    return true;
  }

  async function saveField(field: EntityFieldDefinition, rawValue: string) {
    if (mode !== "edit") {
      return;
    }

    if (!isFieldEditable(field)) {
      return;
    }

    if (!record?.id) {
      setMessage(labels.noRecordId);
      return;
    }

    const validationResult = validateSingleField(field, rawValue);
    const value = validationResult.value.trim();
    const displayValue = getInitialFormFieldValue(field, value);

    setFormData((currentFormData) => ({
      ...currentFormData,
      [field.dbName]: displayValue,
    }));

    if (validationResult.error) {
      setFieldError(field, validationResult.error);
      return;
    }

    clearFieldError(field);

    const previousValidationResult = validateSingleField(
      field,
      String(savedFormData[field.dbName] ?? "")
    );

    const previousValue = previousValidationResult.value.trim();

    if (value === previousValue) {
      return;
    }

    if (field.required && !value) {
      setFieldError(field, getRequiredFieldMessage(field));
      return;
    }

    setSavingFieldName(field.dbName);
    setMessage(null);

    const result = await updateRecordFieldAction({
      id: record.id,
      fieldName: field.dbName,
      value,
    });

    setSavingFieldName(null);

    if (!result.ok) {
      setFieldError(field, result.error);
      return;
    }

    const savedDisplayValue = getInitialFormFieldValue(field, result.data.value);

    setFormData((currentFormData) => ({
      ...currentFormData,
      [field.dbName]: savedDisplayValue,
    }));

    setSavedFormData((currentSavedFormData) => ({
      ...currentSavedFormData,
      [field.dbName]: savedDisplayValue,
    }));

    setMessage(labels.recordSaved);
    router.refresh();
  }

  async function saveRelationDefaultFields({
    fieldsToSave,
    data,
  }: {
    fieldsToSave: EntityFieldDefinition[];
    data: Record<string, string>;
  }) {
    if (mode !== "edit") {
      return;
    }

    for (const field of fieldsToSave) {
      await saveField(field, data[field.dbName] ?? "");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "edit") {
      return;
    }

    await tryCreateRecordAutomatically({
      data: formData,
      showMissingRequiredError: true,
    });
  }

  function getFieldClassName(field: EntityFieldDefinition) {
    const hasError = Boolean(fieldErrors[field.dbName]);
    const calculated = isFieldCalculated(field);

    return [
      "input-app mt-1 px-3 py-2 text-sm",
      calculated
        ? "border-primary-app bg-app-soft font-semibold text-primary-app shadow-inner"
        : "",
      !isFieldEditable(field) && !calculated
        ? "cursor-not-allowed bg-app-soft text-app-muted"
        : "",
      calculated ? "cursor-not-allowed" : "",
      hasError
        ? "border-red-500 text-red-700 outline-red-500 focus:border-red-500 focus:outline-red-500 focus:ring-red-500"
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getBooleanFieldClassName(field: EntityFieldDefinition) {
    const hasError = Boolean(fieldErrors[field.dbName]);

    return [
      "mt-2 h-4 w-4 rounded border-app text-primary-app accent-[var(--color-primary)]",
      !isFieldEditable(field) ? "cursor-not-allowed opacity-60" : "",
      hasError ? "outline outline-2 outline-red-500" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function renderFieldError(field: EntityFieldDefinition) {
    const error = fieldErrors[field.dbName];

    if (!error) {
      return null;
    }

    return (
      <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
        {error}
      </p>
    );
  }

  function renderField(field: EntityFieldDefinition) {
    const value = formData[field.dbName] ?? "";
    const isSavingThisField = savingFieldName === field.dbName;
    const selectOptions =
      getDynamicSelectOptions(field) ?? selectOptionsByField[field.dbName];

    if (field.type === "boolean") {
      const checked = parseBooleanFieldValue(value);

      return (
        <div>
          <input
            ref={(input) => {
              inputRefs.current[field.dbName] = input;
            }}
            type="checkbox"
            className={getBooleanFieldClassName(field)}
            checked={checked}
            disabled={isSavingThisField || isCreating || !isFieldEditable(field)}
            onChange={(event) => {
              if (!isFieldEditable(field)) {
                return;
              }

              const nextValue = event.target.checked ? "true" : "false";
              const nextFormData = updateField(field, nextValue);

              if (mode === "edit") {
                void saveField(field, nextValue);
                return;
              }

              void tryCreateRecordAutomatically({
                data: nextFormData,
              });
            }}
          />

          {renderFieldError(field)}

          {isSavingThisField && (
            <p className="mt-1 text-xs text-app-muted">{labels.saving}</p>
          )}
        </div>
      );
    }

    if (field.type === "option") {
      return (
        <div>
          <select
            className={getFieldClassName(field)}
            value={value}
            required={field.required}
            disabled={isSavingThisField || isCreating || !isFieldEditable(field)}
            onChange={(event) => {
              if (!isFieldEditable(field)) {
                return;
              }

              const nextValue = event.target.value;
              const nextFormData = updateField(field, nextValue);
              const resetFieldsResult = applyResetFieldValues({
                changedField: field,
                data: nextFormData,
              });

              setFormData(resetFieldsResult.data);

              if (mode === "edit") {
                void (async () => {
                  await saveField(field, nextValue);
                  await saveRelationDefaultFields({
                    fieldsToSave: resetFieldsResult.changedFields,
                    data: resetFieldsResult.data,
                  });
                })();
                return;
              }

              void tryCreateRecordAutomatically({
                data: resetFieldsResult.data,
              });
            }}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value || "__blank"} value={option.value}>
                {getOptionLabel({
                  option,
                  fieldLabels,
                })}
              </option>
            ))}
          </select>

          {renderFieldError(field)}

          {isSavingThisField && (
            <p className="mt-1 text-xs text-app-muted">{labels.saving}</p>
          )}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div>
          <AutocompleteInput
            className={getFieldClassName(field)}
            value={value}
            options={selectOptions ?? []}
            placeholder={emptySelectLabelsByField[field.dbName] ?? "-"}
            disabled={isSavingThisField || isCreating || !isFieldEditable(field)}
            required={field.required}
            onValueChange={(nextValue) => {
              if (!isFieldEditable(field)) {
                return;
              }

              const updatedFormData = updateField(field, nextValue);

              const defaultValuesResult = applyRelationDefaultValues({
                changedField: field,
                changedValue: nextValue,
                data: updatedFormData,
              });

              setFormData(defaultValuesResult.data);

              if (mode === "edit") {
                void (async () => {
                  await saveField(field, nextValue);
                  await saveRelationDefaultFields({
                    fieldsToSave: defaultValuesResult.changedFields,
                    data: defaultValuesResult.data,
                  });
                })();

                return;
              }

              void tryCreateRecordAutomatically({
                data: defaultValuesResult.data,
              });
            }}
          />

          {renderFieldError(field)}

          {isSavingThisField && (
            <p className="mt-1 text-xs text-app-muted">{labels.saving}</p>
          )}
        </div>
      );
    }

    return (
      <div>
        <input
          ref={(input) => {
            inputRefs.current[field.dbName] = input;
          }}
          type={getInputType(field)}
          inputMode={getInputMode(field)}
          className={getFieldClassName(field)}
          value={value}
          onChange={(event) => {
            if (!isFieldEditable(field)) {
              return;
            }

            updateField(field, event.target.value);
          }}
          onBlur={(event) => {
            if (!isFieldEditable(field)) {
              return;
            }

            if (mode === "edit") {
              void saveField(field, event.target.value);
              return;
            }

            const validationResult = validateSingleField(
              field,
              event.target.value
            );

            const displayValue = validationResult.error
              ? validationResult.value
              : getInitialFormFieldValue(field, validationResult.value);

            const nextFormData = {
              ...formData,
              [field.dbName]: displayValue,
            };

            setFormData(nextFormData);

            if (validationResult.error) {
              setFieldError(field, validationResult.error);
              return;
            }

            clearFieldError(field);

            void tryCreateRecordAutomatically({
              data: nextFormData,
            });
          }}
          required={field.required}
          disabled={isSavingThisField || isCreating || !isFieldEditable(field)}
        />

        {renderFieldError(field)}

        {isSavingThisField && (
          <p className="mt-1 text-xs text-app-muted">{labels.saving}</p>
        )}
      </div>
    );
  }
  const visibleFields = fields.filter((field) =>
    isFieldVisibleInForm(field, formData)
  );
  return (
    <form onSubmit={handleSubmit} className="card-app p-5">
      <EntityFormLayoutRenderer
        fields={visibleFields}
        layout={formLayout}
        formLayoutLabels={formLayoutLabels}
        renderField={(
          field: EntityFieldDefinition,
          placement?: EntityFormFieldPlacement
        ) => (
          <div
            key={field.key}
            className={
              placement?.colSpan === "full" || field.formColSpan === "full"
                ? "col-span-full"
                : ""
            }
          >
            <label className="text-sm font-medium text-primary-app">
              {getFieldLabel(fieldLabels, field)}
            </label>

            {renderField(field)}
          </div>
        )}
      />

      {message && (
        <div
          className={[
            "mt-5 rounded-lg border px-3 py-2 text-sm font-medium",
            Object.values(fieldErrors).some(Boolean)
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-app bg-app-soft text-app-muted",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {message}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        {mode === "create" && isCreating && (
          <span className="text-sm font-medium text-app-muted">
            {labels.saving}
          </span>
        )}

        <a href={cancelHref} className="btn-secondary-app px-5 py-2 text-sm">
          {labels.cancel}
        </a>
      </div>
    </form>
  );
}

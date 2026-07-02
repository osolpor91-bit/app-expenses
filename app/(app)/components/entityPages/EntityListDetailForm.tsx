"use client";

import type {
  EntityFieldDefinition,
  EntityFieldRelationDefinition,
} from "@/lib/entityFields/types";
import type {
  EntityRecord,
  ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";
import type { EntityRelationOptionsByField } from "@/lib/entities/core/entityRelations";
import type { PurchaseLineSourceOptionsByType } from "@/lib/purchaseLines/purchaseLineLookups";
import { buildFieldValidators } from "@/lib/validation/fieldValidationRegistry";
import { hasNonZeroInventory } from "@/lib/items/inventory";

import EntityAutoSaveForm, {
  type EntityAutoSaveFormData,
} from "../EntityAutoSaveForm";
import {
  createListDetailRecordAction,
  updateListDetailFieldAction,
} from "../../actions/entityActions";

type SelectOptionValue = string | number | boolean | null;

type SelectOption = {
  value: string;
  label: string;
  values?: Record<string, SelectOptionValue>;
};

type EntityFormContextValues = {
  activeCompanyCurrencyCode?: string | null;
};

type EntityListDetailFormLabels = {
  fieldRequired: string;
  save: string;
  saving: string;
  cancel: string;
  createError: string;
  saveError: string;
  noRecordId: string;
  recordSaved: string;
  autoCreateHint?: string;
  validationMessages: Record<string, unknown>;
  formLayoutLabels?: Record<string, string>;
  selectPlaceholderByField?: Record<string, string>;
};

type EntityListDetailFormProps = {
  entity: ListDetailEntityDefinition;
  mode: "create" | "edit";
  record?: EntityRecord | EntityAutoSaveFormData;
  relationOptionsByField?: EntityRelationOptionsByField;
  purchaseLineSourceOptionsByType?: PurchaseLineSourceOptionsByType | null;
  fieldLabels: Record<string, string>;
  visibleFormFieldKeys?: string[];
  formContextValues?: EntityFormContextValues;
  labels: EntityListDetailFormLabels;
};

function getFormFields({
  entity,
  mode,
  record,
  visibleFormFieldKeys,
}: {
  entity: ListDetailEntityDefinition;
  mode: "create" | "edit";
  record?: EntityRecord | EntityAutoSaveFormData;
  visibleFormFieldKeys?: string[];
}) {
  const baseFields = entity.fields
    .filter((field) => field.showInForm)
    .map((field) => {
      if (
        entity.key === "items" &&
        mode === "edit" &&
        field.dbName === "base_unit_of_measure" &&
        hasNonZeroInventory(record?.inventory)
      ) {
        return {
          ...field,
          editable: false,
        };
      }

      return field;
    });

  if (!visibleFormFieldKeys) {
    return baseFields;
  }

  const visibleFieldKeys = new Set(visibleFormFieldKeys);

  return baseFields.filter((field) => {
    if (visibleFieldKeys.has(field.key)) {
      return true;
    }

    // En creación no ocultamos campos obligatorios para no romper
    // la autocreación del registro.
    if (mode === "create" && field.required) {
      return true;
    }

    return false;
  });
}

function getFieldLabel(
  fieldLabels: Record<string, string>,
  field: EntityFieldDefinition
) {
  return fieldLabels[field.dbName] ?? fieldLabels[field.key] ?? field.labelKey;
}

function getRelationSelectOptions(
  relation: EntityFieldRelationDefinition | undefined,
  field: EntityFieldDefinition,
  relationOptionsByField: EntityRelationOptionsByField
): SelectOption[] {
  if (!relation) {
    return [];
  }

  return (relationOptionsByField[field.dbName] ?? []).map((option) => ({
    value: option.id,
    label: option.label,
    values: option.values,
  }));
}

function buildSelectOptionsByField({
  fields,
  relationOptionsByField,
}: {
  fields: readonly EntityFieldDefinition[];
  relationOptionsByField: EntityRelationOptionsByField;
}) {
  return fields.reduce<Record<string, SelectOption[]>>((options, field) => {
    if (field.type !== "select") {
      return options;
    }

    if (!field.relation) {
      return options;
    }

    options[field.dbName] = getRelationSelectOptions(
      field.relation,
      field,
      relationOptionsByField
    );

    return options;
  }, {});
}

function buildEmptySelectLabelsByField({
  fields,
  fieldLabels,
  labels,
}: {
  fields: readonly EntityFieldDefinition[];
  fieldLabels: Record<string, string>;
  labels: EntityListDetailFormLabels;
}) {
  return fields.reduce<Record<string, string>>((emptyLabels, field) => {
    if (field.type !== "select") {
      return emptyLabels;
    }

    const explicitLabel = labels.selectPlaceholderByField?.[field.dbName];

    emptyLabels[field.dbName] =
      explicitLabel ?? `Selecciona ${getFieldLabel(fieldLabels, field)}`;

    return emptyLabels;
  }, {});
}

export default function EntityListDetailForm({
  entity,
  mode,
  record,
  relationOptionsByField = {},
  purchaseLineSourceOptionsByType = null,
  fieldLabels,
  visibleFormFieldKeys,
  formContextValues = {},
  labels,
}: EntityListDetailFormProps) {
  const formFields = getFormFields({
    entity,
    mode,
    record,
    visibleFormFieldKeys,
  });

  async function createRecord(values: Record<string, string>) {
    return createListDetailRecordAction({
      entityKey: entity.key,
      values,
    });
  }

  async function updateRecordField({
    id,
    fieldName,
    value,
  }: {
    id: string;
    fieldName: string;
    value: string;
  }) {
    return updateListDetailFieldAction({
      entityKey: entity.key,
      id,
      fieldName,
      value,
    });
  }

  return (
    <EntityAutoSaveForm
      mode={mode}
      record={record as EntityAutoSaveFormData | undefined}
      fields={formFields}
      fieldLabels={fieldLabels}
      formLayout={entity.formLayout}
      formLayoutLabels={labels.formLayoutLabels}
      formContextValues={formContextValues}
      labels={{
        fieldRequired: labels.fieldRequired,
        save: labels.save,
        saving: labels.saving,
        cancel: labels.cancel,
        createError: labels.createError,
        saveError: labels.saveError,
        noRecordId: labels.noRecordId,
        recordSaved: labels.recordSaved,
        autoCreateHint: labels.autoCreateHint,
      }}
      cancelHref={entity.route}
      selectOptionsByField={buildSelectOptionsByField({
        fields: formFields,
        relationOptionsByField,
      })}
      purchaseLineSourceOptionsByType={purchaseLineSourceOptionsByType}
      emptySelectLabelsByField={buildEmptySelectLabelsByField({
        fields: formFields,
        fieldLabels,
        labels,
      })}
      fieldValidators={buildFieldValidators(
        formFields,
        labels.validationMessages
      )}
      createRecordAction={createRecord}
      updateRecordFieldAction={updateRecordField}
      getFieldLabel={getFieldLabel}
      redirectToRecord={(id) => `${entity.route}/${id}`}
    />
  );
}

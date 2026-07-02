import {
  getFieldLabels,
  getFieldLabelsByDbName,
} from "@/lib/entityFields/helpers";
import type {
  EntityDefinition,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { FieldValidationMessages } from "@/lib/validation/fieldValidationRegistry";
import type { EntityServiceLabels } from "@/lib/services/entityFieldService";

type DictionaryLike = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getDictionarySection(
  dict: DictionaryLike,
  key: string
): Record<string, unknown> {
  const section = dict[key];

  if (isRecord(section)) {
    return section;
  }

  return {};
}

function getCommonDictionary(dict: DictionaryLike) {
  return getDictionarySection(dict, "common");
}

function getValidationMessagesFromSection(section: Record<string, unknown>) {
  const validations = section.validations;

  if (isRecord(validations)) {
    return validations;
  }

  return {};
}

function getGridMessagesFromSection(section: Record<string, unknown>) {
  const grid = section.grid;

  if (isRecord(grid)) {
    return grid;
  }

  return {};
}

function getFieldLabelFromSection(
  field: EntityFieldDefinition,
  labelsSection: Record<string, unknown>,
  fallbackLabelsSection: Record<string, unknown> = {}
) {
  const value =
    labelsSection[field.labelKey] ?? fallbackLabelsSection[field.labelKey];

  return typeof value === "string" ? value : field.labelKey;
}

function getFlexibleFieldLabels(
  fields: readonly EntityFieldDefinition[],
  labelsSection: Record<string, unknown>,
  fallbackLabelsSection: Record<string, unknown> = {}
) {
  return fields.reduce<Record<string, string>>((labels, field) => {
    const label = getFieldLabelFromSection(
      field,
      labelsSection,
      fallbackLabelsSection
    );

    labels[field.labelKey] = label;
    labels[field.dbName] = label;
    labels[field.key] = label;

    field.options?.forEach((option) => {
      const optionLabel =
        labelsSection[option.labelKey] ?? fallbackLabelsSection[option.labelKey];

      labels[option.labelKey] =
        typeof optionLabel === "string" ? optionLabel : option.labelKey;
    });

    return labels;
  }, {});
}

export function getEntityDictionarySection(
  entity: EntityDefinition,
  dict: DictionaryLike
) {
  return getDictionarySection(dict, entity.labelsKey);
}

export function getEntityFieldLabels(
  entity: EntityDefinition,
  dict: DictionaryLike
) {
  return getFlexibleFieldLabels(
    entity.fields,
    getEntityDictionarySection(entity, dict),
    getCommonDictionary(dict)
  );
}

export function getEntityFieldLabelsByDbName(
  entity: EntityDefinition,
  dict: DictionaryLike
) {
  return getFieldLabelsByDbName(
    entity.fields,
    getEntityDictionarySection(entity, dict),
    getCommonDictionary(dict)
  );
}

export function getEntityValidationMessages(
  entity: EntityDefinition,
  dict: DictionaryLike
): FieldValidationMessages {
  const common = getCommonDictionary(dict);
  const entitySection = getEntityDictionarySection(entity, dict);
  const commonValidations = getValidationMessagesFromSection(common);
  const entityValidations = getValidationMessagesFromSection(entitySection);
  const entityGridMessages = getGridMessagesFromSection(entitySection);

  return {
    ...commonValidations,
    ...entityValidations,
    ...entityGridMessages,
  };
}

export function getEntityFormLayoutLabels(
  entity: EntityDefinition,
  dict: DictionaryLike
) {
  if (entity.pageMode !== "list-detail" || !entity.formLayout) {
    return {};
  }

  const labelsSection = getEntityDictionarySection(entity, dict);

  return entity.formLayout.sections.reduce<Record<string, string>>(
    (labels, section) => {
      if (!section.labelKey) {
        return labels;
      }

      const value = labelsSection[section.labelKey];
      labels[section.labelKey] =
        typeof value === "string" ? value : section.labelKey;

      return labels;
    },
    {}
  );
}

export function getEntityServiceLabels(
  entity: EntityDefinition,
  dict: DictionaryLike
): EntityServiceLabels {
  const common = getCommonDictionary(dict);
  const fieldRequired = common.fieldRequired;

  return {
    fieldRequired:
      typeof fieldRequired === "string"
        ? fieldRequired
        : "El campo {field} es obligatorio.",
    validationMessages: getEntityValidationMessages(entity, dict),
    fieldLabelsByDbName: getEntityFieldLabelsByDbName(entity, dict),
  };
}

export function getEntitySubformDictionarySection(
  subform: EntitySubformDefinition,
  dict: DictionaryLike
) {
  return getDictionarySection(dict, subform.labelsKey);
}

export function getEntitySubformFieldLabels(
  subform: EntitySubformDefinition,
  dict: DictionaryLike
) {
  return getFlexibleFieldLabels(
    subform.fields,
    getEntitySubformDictionarySection(subform, dict),
    getCommonDictionary(dict)
  );
}

export function getEntitySubformFieldLabelsByDbName(
  subform: EntitySubformDefinition,
  dict: DictionaryLike
) {
  return getFieldLabelsByDbName(
    subform.fields,
    getEntitySubformDictionarySection(subform, dict),
    getCommonDictionary(dict)
  );
}

export function getEntitySubformValidationMessages(
  subform: EntitySubformDefinition,
  dict: DictionaryLike
): FieldValidationMessages {
  const common = getCommonDictionary(dict);
  const subformSection = getEntitySubformDictionarySection(subform, dict);
  const commonValidations = getValidationMessagesFromSection(common);
  const subformValidations = getValidationMessagesFromSection(subformSection);
  const subformGridMessages = getGridMessagesFromSection(subformSection);

  return {
    ...commonValidations,
    ...subformValidations,
    ...subformGridMessages,
  };
}

export function getEntitySubformServiceLabels(
  subform: EntitySubformDefinition,
  dict: DictionaryLike
): EntityServiceLabels {
  const common = getCommonDictionary(dict);
  const fieldRequired = common.fieldRequired;

  return {
    fieldRequired:
      typeof fieldRequired === "string"
        ? fieldRequired
        : "El campo {field} es obligatorio.",
    validationMessages: getEntitySubformValidationMessages(subform, dict),
    fieldLabelsByDbName: getEntitySubformFieldLabelsByDbName(subform, dict),
  };
}
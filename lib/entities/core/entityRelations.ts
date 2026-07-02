import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type {
  EntityDefinition,
  EntityRecord,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import { getEntityDefinition } from "@/lib/entities/core/entityRegistry";
import {
  castEntityRecords,
  listEntityRecords,
  type EntityScopeContext,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";

export type EntityRelationOptionValue = string | number | boolean | null;

export type EntityRelationOption = {
  id: string;
  label: string;
  values?: Record<string, EntityRelationOptionValue>;
};

export type EntityRelationOptionsByField = Record<
  string,
  EntityRelationOption[]
>;

function isRelationField(field: EntityFieldDefinition) {
  return Boolean(field.relation);
}

export function getEntityRelationFields(entity: EntityDefinition) {
  return entity.fields.filter(isRelationField);
}

function getFirstRelationRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    const first = value[0];

    return first && typeof first === "object"
      ? (first as Record<string, unknown>)
      : null;
  }

  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

function getRelationDataFieldName(field: EntityFieldDefinition) {
  return field.relation?.relationDataFieldName ?? field.relation?.entityKey;
}

function getRelationValueFieldName(field: EntityFieldDefinition) {
  return field.relation?.optionValueField ?? "id";
}

function getPrimitiveRelationValues(
  record: EntityRecord
): Record<string, EntityRelationOptionValue> {
  return Object.entries(record).reduce<Record<string, EntityRelationOptionValue>>(
    (values, [key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        values[key] = value;
      }

      return values;
    },
    {}
  );
}

export function formatRelationLabel(
  record: Record<string, unknown> | null | undefined,
  field: EntityFieldDefinition
) {
  if (!record || !field.relation) {
    return "";
  }

  const separator = field.relation.labelSeparator ?? " - ";

  return field.relation.optionLabelFieldNames
    .map((labelFieldName) => String(record[labelFieldName] ?? "").trim())
    .filter(Boolean)
    .join(separator);
}

export function mapEntityRecordRelations<TEntityRecord extends EntityRecord>(
  entity: EntityDefinition,
  record: TEntityRecord
): TEntityRecord {
  const relationFields = getEntityRelationFields(entity);

  if (relationFields.length === 0) {
    return record;
  }

  const mappedRecord: EntityRecord = {
    ...record,
  };

  relationFields.forEach((field) => {
    if (!field.relation) {
      return;
    }

    const relationDataFieldName = getRelationDataFieldName(field);

    if (!relationDataFieldName) {
      return;
    }

    const relationRecord = getFirstRelationRecord(
      mappedRecord[relationDataFieldName]
    );

    mappedRecord[field.relation.displayFieldName] = formatRelationLabel(
      relationRecord,
      field
    );
  });

  return mappedRecord as TEntityRecord;
}

export function mapEntityRecordsRelations<TEntityRecord extends EntityRecord>(
  entity: EntityDefinition,
  records: TEntityRecord[]
): TEntityRecord[] {
  return records.map((record) => mapEntityRecordRelations(entity, record));
}

async function loadRelationOptionsForFields({
  supabase,
  fields,
  context,
}: {
  supabase: SupabaseServerClient;
  fields: readonly EntityFieldDefinition[];
  context: EntityScopeContext;
}): Promise<EntityRelationOptionsByField> {
  const relationFields = fields.filter(isRelationField);
  const optionsByField: EntityRelationOptionsByField = {};

  for (const field of relationFields) {
    if (!field.relation) {
      continue;
    }

    const relatedEntity = getEntityDefinition(field.relation.entityKey);

    if (!relatedEntity) {
      optionsByField[field.dbName] = [];
      continue;
    }

    const { data, error } = await listEntityRecords({
      supabase,
      entity: relatedEntity,
      context,
      searchParams: field.relation.optionFilterParams ?? {},
    });

    if (error) {
      optionsByField[field.dbName] = [];
      continue;
    }

    const valueFieldName = getRelationValueFieldName(field);
    const options: EntityRelationOption[] = [];

    castEntityRecords(data).forEach((record) => {
      const id = String(record[valueFieldName] ?? "").trim();
      const label = formatRelationLabel(record, field);

      if (!id || !label) {
        return;
      }

      options.push({
        id,
        label,
        values: getPrimitiveRelationValues(record),
      });
    });

    optionsByField[field.dbName] = options;
  }

  return optionsByField;
}

export async function loadEntityRelationOptions({
  supabase,
  entity,
  context,
}: {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
}): Promise<EntityRelationOptionsByField> {
  return loadRelationOptionsForFields({
    supabase,
    fields: entity.fields,
    context,
  });
}

export async function loadEntitySubformRelationOptions({
  supabase,
  subform,
  context,
}: {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
}): Promise<EntityRelationOptionsByField> {
  return loadRelationOptionsForFields({
    supabase,
    fields: subform.fields,
    context,
  });
}
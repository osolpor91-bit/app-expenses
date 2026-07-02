import { buildEntityPayloadFromFields } from "@/lib/entityFields/helpers";
import {
  hasFieldBeforeDeleteBusinessRules,
  hasFieldBeforeUpdateBusinessRules,
  validateFieldBeforeDeleteBusinessRules,
  validateFieldBeforeUpdateBusinessRules,
} from "@/lib/domain/businessRules";
import type {
  EntityDefinition,
  EntityRecord,
} from "@/lib/entities/core/entityDefinition";
import {
  castDeletedIds,
  castEntityRecord,
  deleteEntityRecordsByIds,
  getEntityBasePayload,
  getEntityRecordById,
  insertEntityRecord,
  type EntityScopeContext,
  type EntityWritePayload,
  type SupabaseServerClient,
  updateEntityRecordById,
} from "@/lib/entities/core/entityRepository";
import {
  normalizeEntityValues,
  validateEntityField,
  type EntityFieldInputValue,
  type EntityServiceLabels,
} from "@/lib/services/entityFieldService";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

export type EntityValuesInput = Record<string, EntityFieldInputValue>;

type CreateEntityRecordParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  values: EntityValuesInput;
  labels: EntityServiceLabels;
  extraPayload?: EntityWritePayload;
};

type UpdateEntityRecordParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
  values: EntityValuesInput;
  labels: EntityServiceLabels;
};

type UpdateEntityFieldParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
  fieldName: string;
  value: EntityFieldInputValue;
  labels: EntityServiceLabels;
  extraPayload?: EntityWritePayload;
};

type DeleteEntityRecordsParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  ids: string[];
  labels: EntityServiceLabels;
};

function getUpdatedAtPayload(entity: EntityDefinition): EntityWritePayload {
  if (!entity.updatedAtColumn) {
    return {};
  }

  return {
    [entity.updatedAtColumn]: new Date().toISOString(),
  };
}

function buildCreatePayload({
  entity,
  context,
  values,
}: {
  entity: EntityDefinition;
  context: EntityScopeContext;
  values: EntityValuesInput;
}) {
  const basePayload = {
    ...(getEntityBasePayload(entity, context) as Record<string, string>),
    ...(getUpdatedAtPayload(entity) as Record<string, string>),
  };

  return buildEntityPayloadFromFields(
    entity.fields,
    values,
    basePayload
  ) as EntityWritePayload;
}

function buildUpdatePayload({
  entity,
  values,
}: {
  entity: EntityDefinition;
  values: EntityValuesInput;
}) {
  return {
    ...buildEntityPayloadFromFields(entity.fields, values, {}),
    ...getUpdatedAtPayload(entity),
  } as EntityWritePayload;
}

async function validateBeforeUpdateBusinessRules({
  supabase,
  entity,
  context,
  id,
  values,
  labels,
}: {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
  values: EntityValuesInput;
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<null>> {
  const fieldsWithBeforeUpdateBusinessRules = entity.fields.filter((field) => {
    return (
      Object.prototype.hasOwnProperty.call(values, field.dbName) &&
      hasFieldBeforeUpdateBusinessRules(field)
    );
  });

  if (fieldsWithBeforeUpdateBusinessRules.length === 0) {
    return entityOperationOk(null);
  }

  const { data, error } = await getEntityRecordById({
    supabase,
    entity,
    context,
    id,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const currentRecord = castEntityRecord(data);

  if (!currentRecord) {
    return entityOperationError("No se ha podido leer el registro actual.");
  }

  for (const field of fieldsWithBeforeUpdateBusinessRules) {
    const businessRuleResult = await validateFieldBeforeUpdateBusinessRules({
      entity,
      field,
      currentRecord,
      newValue: values[field.dbName],
      labels,
    });

    if (!businessRuleResult.valid) {
      return entityOperationError(businessRuleResult.message);
    }
  }

  return entityOperationOk(null);
}

export async function createStandardEntityRecord({
  supabase,
  entity,
  context,
  values,
  labels,
  extraPayload = {},
}: CreateEntityRecordParams): Promise<
  EntityOperationResult<{ record: EntityRecord }>
> {
  const normalizedValuesResult = normalizeEntityValues({
    fields: entity.fields,
    values,
    labels,
  });

  if (!normalizedValuesResult.ok) {
    return normalizedValuesResult;
  }

  const payload = {
    ...buildCreatePayload({
      entity,
      context,
      values: normalizedValuesResult.data,
    }),
    ...extraPayload,
  };

  const { data, error } = await insertEntityRecord({
    supabase,
    entity,
    payload,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const record = castEntityRecord(data);

  if (!record) {
    return entityOperationError("No se ha podido leer el registro guardado.");
  }

  return entityOperationOk({
    record,
  });
}

export async function updateStandardEntityRecord({
  supabase,
  entity,
  context,
  id,
  values,
  labels,
}: UpdateEntityRecordParams): Promise<
  EntityOperationResult<{ record: EntityRecord }>
> {
  const normalizedValuesResult = normalizeEntityValues({
    fields: entity.fields,
    values,
    labels,
  });

  if (!normalizedValuesResult.ok) {
    return normalizedValuesResult;
  }

  const businessRulesResult = await validateBeforeUpdateBusinessRules({
    supabase,
    entity,
    context,
    id,
    values: normalizedValuesResult.data,
    labels,
  });

  if (!businessRulesResult.ok) {
    return businessRulesResult;
  }

  const payload = buildUpdatePayload({
    entity,
    values: normalizedValuesResult.data,
  });

  const { data, error } = await updateEntityRecordById({
    supabase,
    entity,
    context,
    id,
    payload,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const record = castEntityRecord(data);

  if (!record) {
    return entityOperationError("No se ha podido leer el registro guardado.");
  }

  return entityOperationOk({
    record,
  });
}

export async function updateStandardEntityField({
  supabase,
  entity,
  context,
  id,
  fieldName,
  value,
  labels,
  extraPayload = {},
}: UpdateEntityFieldParams): Promise<
  EntityOperationResult<{ value: string | null }>
> {
  const validationResult = validateEntityField({
    fields: entity.fields,
    fieldName,
    value,
    labels,
  });

  if (!validationResult.ok) {
    return validationResult;
  }

  const businessRulesResult = await validateBeforeUpdateBusinessRules({
    supabase,
    entity,
    context,
    id,
    values: {
      [validationResult.data.fieldName]: validationResult.data.value,
    },
    labels,
  });

  if (!businessRulesResult.ok) {
    return businessRulesResult;
  }

  const payload = {
    [validationResult.data.fieldName]: validationResult.data.value,
    ...extraPayload,
    ...getUpdatedAtPayload(entity),
  } as EntityWritePayload;

  const { data, error } = await updateEntityRecordById({
    supabase,
    entity,
    context,
    id,
    payload,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const updatedRecord = castEntityRecord(data);

  if (!updatedRecord || !updatedRecord.id) {
    return entityOperationError("No se ha podido guardar el registro.");
  }

  return entityOperationOk({
    value:
      validationResult.data.value === null
        ? null
        : String(validationResult.data.value),
  });
}

async function validateBeforeDeleteBusinessRules({
  supabase,
  entity,
  context,
  ids,
  labels,
}: {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  ids: string[];
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<null>> {
  const fieldsWithBeforeDeleteBusinessRules = entity.fields.filter((field) => {
    return hasFieldBeforeDeleteBusinessRules(field);
  });

  if (fieldsWithBeforeDeleteBusinessRules.length === 0) {
    return entityOperationOk(null);
  }

  for (const id of ids) {
    const { data, error } = await getEntityRecordById({
      supabase,
      entity,
      context,
      id,
    });

    if (error) {
      return entityOperationError(error.message);
    }

    const currentRecord = castEntityRecord(data);

    if (!currentRecord) {
      return entityOperationError("No se ha podido leer el registro actual.");
    }

    for (const field of fieldsWithBeforeDeleteBusinessRules) {
      const businessRuleResult = await validateFieldBeforeDeleteBusinessRules({
        entity,
        field,
        currentRecord,
        newValue: currentRecord[field.dbName] ?? null,
        labels,
        supabase,
        context,
      });

      if (!businessRuleResult.valid) {
        return entityOperationError(businessRuleResult.message);
      }
    }
  }

  return entityOperationOk(null);
}

export async function deleteStandardEntityRecords({
  supabase,
  entity,
  context,
  ids,
  labels,
}: DeleteEntityRecordsParams): Promise<
  EntityOperationResult<{ ids: string[] }>
> {
  const businessRulesResult = await validateBeforeDeleteBusinessRules({
    supabase,
    entity,
    context,
    ids,
    labels,
  });

  if (!businessRulesResult.ok) {
    return businessRulesResult;
  }

  const { data, error } = await deleteEntityRecordsByIds({
    supabase,
    entity,
    context,
    ids,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const deletedIds = castDeletedIds(data);

  if (deletedIds.length === 0) {
    return entityOperationError("No se ha eliminado ningún registro.");
  }

  return entityOperationOk({
    ids: deletedIds,
  });
}

export async function deleteStandardEntityRecord({
  supabase,
  entity,
  context,
  id,
  labels,
}: {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<{ id: string }>> {
  const result = await deleteStandardEntityRecords({
    supabase,
    entity,
    context,
    ids: [id],
    labels,
  });

  if (!result.ok) {
    return result;
  }

  const deletedId = result.data.ids[0];

  if (!deletedId) {
    return entityOperationError("No se ha eliminado ningún registro.");
  }

  return entityOperationOk({
    id: deletedId,
  });
}
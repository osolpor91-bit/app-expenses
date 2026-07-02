import { buildEntityPayloadFromFields } from "@/lib/entityFields/helpers";
import {
  hasFieldBeforeCreateBusinessRules,
  hasFieldBeforeDeleteBusinessRules,
  hasFieldBeforeUpdateBusinessRules,
  validateFieldBeforeCreateBusinessRules,
  validateFieldBeforeDeleteBusinessRules,
  validateFieldBeforeUpdateBusinessRules,
} from "@/lib/domain/businessRules";
import type {
  EntityRecord,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import {
  castDeletedIds,
  type EntityScopeContext,
  type EntityWritePayload,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  castEntitySubformRecord,
  deleteEntitySubformRecordsByIds,
  getEntitySubformBasePayload,
  getEntitySubformRecordById,
  insertEntitySubformRecord,
  updateEntitySubformRecordById,
} from "@/lib/entities/core/entitySubformRepository";
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

export type EntitySubformValuesInput = Record<string, EntityFieldInputValue>;

type CreateEntitySubformRecordParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  values: EntitySubformValuesInput;
  labels: EntityServiceLabels;
  extraPayload?: EntityWritePayload;
};

type UpdateEntitySubformFieldParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  id: string;
  fieldName: string;
  value: EntityFieldInputValue;
  labels: EntityServiceLabels;
  extraPayload?: EntityWritePayload;
};

type DeleteEntitySubformRecordsParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  ids: string[];
  labels: EntityServiceLabels;
};

function getUpdatedAtPayload(
  subform: EntitySubformDefinition
): EntityWritePayload {
  if (!subform.updatedAtColumn) {
    return {};
  }

  return {
    [subform.updatedAtColumn]: new Date().toISOString(),
  };
}

function buildCreatePayload({
  subform,
  context,
  parentId,
  values,
}: {
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  values: EntitySubformValuesInput;
}) {
  const basePayload = {
    ...getEntitySubformBasePayload({
      subform,
      context,
      parentId,
    }),
    ...getUpdatedAtPayload(subform),
  } as Record<string, string>;

  return buildEntityPayloadFromFields(subform.fields, values, basePayload);
}

async function validateBeforeCreateBusinessRules({
  supabase,
  subform,
  context,
  parentId,
  values,
  labels,
}: {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  values: EntitySubformValuesInput;
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<null>> {
  const fieldsWithBeforeCreateBusinessRules = subform.fields.filter((field) => {
    return (
      Object.prototype.hasOwnProperty.call(values, field.dbName) &&
      hasFieldBeforeCreateBusinessRules(field)
    );
  });

  if (fieldsWithBeforeCreateBusinessRules.length === 0) {
    return entityOperationOk(null);
  }

  const currentRecord = {
    ...getEntitySubformBasePayload({
      subform,
      context,
      parentId,
    }),
    ...values,
  } as EntityRecord;

  for (const field of fieldsWithBeforeCreateBusinessRules) {
    const businessRuleResult = await validateFieldBeforeCreateBusinessRules({
      entity: subform,
      field,
      currentRecord,
      newValue: values[field.dbName],
      labels,
      supabase,
      context,
    });

    if (!businessRuleResult.valid) {
      return entityOperationError(businessRuleResult.message);
    }
  }

  return entityOperationOk(null);
}

async function validateBeforeUpdateBusinessRules({
  supabase,
  subform,
  context,
  parentId,
  id,
  values,
  labels,
}: {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  id: string;
  values: EntitySubformValuesInput;
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<null>> {
  const fieldsWithBeforeUpdateBusinessRules = subform.fields.filter((field) => {
    return (
      Object.prototype.hasOwnProperty.call(values, field.dbName) &&
      hasFieldBeforeUpdateBusinessRules(field)
    );
  });

  if (fieldsWithBeforeUpdateBusinessRules.length === 0) {
    return entityOperationOk(null);
  }

  const { data, error } = await getEntitySubformRecordById({
    supabase,
    subform,
    context,
    parentId,
    id,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const currentRecord = castEntitySubformRecord(data);

  if (!currentRecord) {
    return entityOperationError("No se ha podido leer la línea actual.");
  }

  for (const field of fieldsWithBeforeUpdateBusinessRules) {
    const businessRuleResult = await validateFieldBeforeUpdateBusinessRules({
      entity: subform,
      field,
      currentRecord,
      newValue: values[field.dbName],
      labels,
      supabase,
      context,
    });

    if (!businessRuleResult.valid) {
      return entityOperationError(businessRuleResult.message);
    }
  }

  return entityOperationOk(null);
}

export async function createStandardEntitySubformRecord({
  supabase,
  subform,
  context,
  parentId,
  values,
  labels,
  extraPayload = {},
}: CreateEntitySubformRecordParams): Promise<
  EntityOperationResult<{ record: EntityRecord }>
> {
  const normalizedValuesResult = normalizeEntityValues({
    fields: subform.fields,
    values,
    labels,
  });

  if (!normalizedValuesResult.ok) {
    return normalizedValuesResult;
  }

  const businessRulesResult = await validateBeforeCreateBusinessRules({
    supabase,
    subform,
    context,
    parentId,
    values: normalizedValuesResult.data,
    labels,
  });

  if (!businessRulesResult.ok) {
    return businessRulesResult;
  }

  const payload = {
    ...buildCreatePayload({
      subform,
      context,
      parentId,
      values: normalizedValuesResult.data,
    }),
    ...extraPayload,
  };

  const { data, error } = await insertEntitySubformRecord({
    supabase,
    subform,
    payload,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const record = castEntitySubformRecord(data);

  if (!record) {
    return entityOperationError("No se ha podido leer la línea guardada.");
  }

  return entityOperationOk({
    record,
  });
}

export async function updateStandardEntitySubformField({
  supabase,
  subform,
  context,
  parentId,
  id,
  fieldName,
  value,
  labels,
  extraPayload = {},
}: UpdateEntitySubformFieldParams): Promise<
  EntityOperationResult<{ value: string | null; record: EntityRecord }>
> {
  const validationResult = validateEntityField({
    fields: subform.fields,
    fieldName,
    value,
    labels,
  });

  if (!validationResult.ok) {
    return validationResult;
  }

  if (typeof validationResult.data.value === "boolean") {
    return entityOperationError(`El campo ${fieldName} no admite valor booleano.`);
  }

  const businessRulesResult = await validateBeforeUpdateBusinessRules({
    supabase,
    subform,
    context,
    parentId,
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
    ...getUpdatedAtPayload(subform),
  } as EntityWritePayload;

  const { data, error } = await updateEntitySubformRecordById({
    supabase,
    subform,
    context,
    parentId,
    id,
    payload,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const updatedRecord = castEntitySubformRecord(data);

  if (!updatedRecord || !updatedRecord.id) {
    return entityOperationError("No se ha podido guardar la línea.");
  }

  return entityOperationOk({
    value:
      validationResult.data.value === null
        ? null
        : String(validationResult.data.value),
    record: updatedRecord,
  });
}

async function validateBeforeDeleteBusinessRules({
  supabase,
  subform,
  context,
  parentId,
  ids,
  labels,
}: {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  ids: string[];
  labels: EntityServiceLabels;
}): Promise<EntityOperationResult<null>> {
  const fieldsWithBeforeDeleteBusinessRules = subform.fields.filter((field) => {
    return hasFieldBeforeDeleteBusinessRules(field);
  });

  if (fieldsWithBeforeDeleteBusinessRules.length === 0) {
    return entityOperationOk(null);
  }

  for (const id of ids) {
    const { data, error } = await getEntitySubformRecordById({
      supabase,
      subform,
      context,
      parentId,
      id,
    });

    if (error) {
      return entityOperationError(error.message);
    }

    const currentRecord = castEntitySubformRecord(data);

    if (!currentRecord) {
      return entityOperationError("No se ha podido leer la línea actual.");
    }

    for (const field of fieldsWithBeforeDeleteBusinessRules) {
      const businessRuleResult = await validateFieldBeforeDeleteBusinessRules({
        entity: subform,
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

export async function deleteStandardEntitySubformRecords({
  supabase,
  subform,
  context,
  parentId,
  ids,
  labels,
}: DeleteEntitySubformRecordsParams): Promise<
  EntityOperationResult<{ ids: string[] }>
> {
  const businessRulesResult = await validateBeforeDeleteBusinessRules({
    supabase,
    subform,
    context,
    parentId,
    ids,
    labels,
  });

  if (!businessRulesResult.ok) {
    return businessRulesResult;
  }

  const { data, error } = await deleteEntitySubformRecordsByIds({
    supabase,
    subform,
    context,
    parentId,
    ids,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  const deletedIds = castDeletedIds(data);

  if (deletedIds.length === 0) {
    return entityOperationError("No se ha eliminado ninguna línea.");
  }

  return entityOperationOk({
    ids: deletedIds,
  });
}
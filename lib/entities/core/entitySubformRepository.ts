import type {
  EntityRecord,
  EntityScope,
  EntitySubformDefinition,
} from "@/lib/entities/core/entityDefinition";
import type {
  EntityScopeContext,
  EntityWritePayload,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";

type ListEntitySubformRecordsParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
};

type GetEntitySubformRecordByIdParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  id: string;
};

type InsertEntitySubformRecordParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  payload: EntityWritePayload;
};

type UpdateEntitySubformRecordByIdParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  id: string;
  payload: EntityWritePayload;
};

type DeleteEntitySubformRecordsByIdsParams = {
  supabase: SupabaseServerClient;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
  ids: string[];
};

function getTableQuery(supabase: SupabaseServerClient, table: string) {
  return (supabase as any).from(table);
}

function getRequiredCompanyId(scope: EntityScope, context: EntityScopeContext) {
  if (scope !== "company") {
    return null;
  }

  if (!context.companyId) {
    throw new Error(
      "El subformulario requiere empresa activa, pero no se ha recibido companyId."
    );
  }

  return context.companyId;
}

function applySubformScope(
  query: any,
  subform: EntitySubformDefinition,
  context: EntityScopeContext
) {
  let scopedQuery = query.eq("tenant_id", context.tenantId);

  const companyId = getRequiredCompanyId(subform.scope, context);

  if (companyId) {
    scopedQuery = scopedQuery.eq("company_id", companyId);
  }

  return scopedQuery;
}

function applySubformOrder(query: any, subform: EntitySubformDefinition) {
  if (!subform.orderBy) {
    return query;
  }

  return query.order(subform.orderBy.column, {
    ascending: subform.orderBy.ascending ?? true,
  });
}

export function getEntitySubformBasePayload({
  subform,
  context,
  parentId,
}: {
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  parentId: string;
}) {
  const basePayload: EntityWritePayload = {
    tenant_id: context.tenantId,
    [subform.parentIdDbName]: parentId,
  };

  const companyId = getRequiredCompanyId(subform.scope, context);

  if (companyId) {
    basePayload.company_id = companyId;
  }

  return basePayload;
}

export async function listEntitySubformRecords({
  supabase,
  subform,
  context,
  parentId,
}: ListEntitySubformRecordsParams) {
  let query = getTableQuery(supabase, subform.table)
    .select(subform.selectColumns)
    .eq(subform.parentIdDbName, parentId);

  query = applySubformScope(query, subform, context);
  query = applySubformOrder(query, subform);

  return query;
}

export async function getEntitySubformRecordById({
  supabase,
  subform,
  context,
  parentId,
  id,
}: GetEntitySubformRecordByIdParams) {
  let query = getTableQuery(supabase, subform.table)
    .select(subform.selectColumns)
    .eq("id", id)
    .eq(subform.parentIdDbName, parentId);

  query = applySubformScope(query, subform, context);

  return query.single();
}

export async function insertEntitySubformRecord({
  supabase,
  subform,
  payload,
}: InsertEntitySubformRecordParams) {
  return getTableQuery(supabase, subform.table)
    .insert(payload)
    .select(subform.selectColumns)
    .single();
}

export async function updateEntitySubformRecordById({
  supabase,
  subform,
  context,
  parentId,
  id,
  payload,
}: UpdateEntitySubformRecordByIdParams) {
  let query = getTableQuery(supabase, subform.table)
    .update(payload)
    .eq("id", id)
    .eq(subform.parentIdDbName, parentId);

  query = applySubformScope(query, subform, context);

  return query.select(subform.selectColumns).single();
}

export async function deleteEntitySubformRecordsByIds({
  supabase,
  subform,
  context,
  parentId,
  ids,
}: DeleteEntitySubformRecordsByIdsParams) {
  let query = getTableQuery(supabase, subform.table)
    .delete()
    .in("id", ids)
    .eq(subform.parentIdDbName, parentId);

  query = applySubformScope(query, subform, context);

  return query.select("id");
}

export function castEntitySubformRecord(data: unknown): EntityRecord | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as EntityRecord;
}
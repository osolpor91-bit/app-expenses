import type { createSupabaseServerClient } from "@/lib/supabaseServer";
import { applyDatabaseFilters } from "@/lib/search/databaseFilters";
import {
  buildTextSearchFilter,
  getSingleSearchParam,
} from "@/lib/search/textSearch";
import type {
  EntityDefinition,
  EntityRecord,
  EntityScope,
  EntityStaticFilterDefinition,
} from "@/lib/entities/core/entityDefinition";

export type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type EntitySearchParams = Record<
  string,
  string | string[] | undefined
>;

export type EntityWritePayload = Record<
  string,
  string | number | boolean | null
>;

export type EntityScopeContext = {
  tenantId: string;
  companyId?: string | null;
};

type ListEntityRecordsParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  searchParams?: EntitySearchParams;
  search?: string;
};

type GetEntityRecordByIdParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
};

type InsertEntityRecordParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  payload: EntityWritePayload;
};

type UpdateEntityRecordByIdParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  id: string;
  payload: EntityWritePayload;
};

type DeleteEntityRecordsByIdsParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  ids: string[];
};

type UpsertEntityRecordsParams = {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  payloads: EntityWritePayload[];
  onConflict: string;
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
      "La entidad requiere empresa activa, pero no se ha recibido companyId."
    );
  }

  return context.companyId;
}

function applyEntityScope(
  query: any,
  entity: EntityDefinition,
  context: EntityScopeContext
) {
  let scopedQuery = query.eq("tenant_id", context.tenantId);

  const companyId = getRequiredCompanyId(entity.scope, context);

  if (companyId) {
    scopedQuery = scopedQuery.eq("company_id", companyId);
  }

  return scopedQuery;
}

function applyEntityStaticFilters(
  query: any,
  staticFilters: readonly EntityStaticFilterDefinition[] = []
) {
  return staticFilters.reduce((filteredQuery, filter) => {
    if (filter.value === null) {
      return filteredQuery.is(filter.column, null);
    }

    return filteredQuery.eq(filter.column, filter.value);
  }, query);
}

function applyEntityOrder(query: any, entity: EntityDefinition) {
  if (!entity.orderBy) {
    return query;
  }

  return query.order(entity.orderBy.column, {
    ascending: entity.orderBy.ascending ?? true,
  });
}

function applyEntitySearch(
  query: any,
  entity: EntityDefinition,
  searchText: string
) {
  const searchColumns = entity.searchColumns ?? [];
  const searchFilter = buildTextSearchFilter(searchText, searchColumns);

  if (!searchFilter) {
    return query;
  }

  return query.or(searchFilter);
}

export async function listEntityRecords({
  supabase,
  entity,
  context,
  searchParams = {},
  search,
}: ListEntityRecordsParams) {
  const searchText = search ?? getSingleSearchParam(searchParams.search);

  let query = getTableQuery(supabase, entity.table).select(
    entity.selectColumns
  );

  query = applyEntityScope(query, entity, context);
  query = applyEntityStaticFilters(query, entity.staticFilters);
  query = applyEntityOrder(query, entity);
  query = applyEntitySearch(query, entity, searchText);

  return applyDatabaseFilters(query, searchParams, entity.filters ?? []);
}

export async function getEntityRecordById({
  supabase,
  entity,
  context,
  id,
}: GetEntityRecordByIdParams) {
  let query = getTableQuery(supabase, entity.table)
    .select(entity.selectColumns)
    .eq("id", id);

  query = applyEntityScope(query, entity, context);
  query = applyEntityStaticFilters(query, entity.staticFilters);

  return query.single();
}

export async function insertEntityRecord({
  supabase,
  entity,
  payload,
}: InsertEntityRecordParams) {
  return getTableQuery(supabase, entity.table)
    .insert(payload)
    .select(entity.selectColumns)
    .single();
}

export async function updateEntityRecordById({
  supabase,
  entity,
  context,
  id,
  payload,
}: UpdateEntityRecordByIdParams) {
  let query = getTableQuery(supabase, entity.table)
    .update(payload)
    .eq("id", id);

  query = applyEntityScope(query, entity, context);
  query = applyEntityStaticFilters(query, entity.staticFilters);

  return query.select(entity.selectColumns).single();
}

export async function deleteEntityRecordsByIds({
  supabase,
  entity,
  context,
  ids,
}: DeleteEntityRecordsByIdsParams) {
  let query = getTableQuery(supabase, entity.table).delete().in("id", ids);

  query = applyEntityScope(query, entity, context);
  query = applyEntityStaticFilters(query, entity.staticFilters);

  return query.select("id");
}

export async function upsertEntityRecords({
  supabase,
  entity,
  payloads,
  onConflict,
}: UpsertEntityRecordsParams) {
  return getTableQuery(supabase, entity.table).upsert(payloads, {
    onConflict,
  });
}

export function getEntityBasePayload(
  entity: EntityDefinition,
  context: EntityScopeContext
) {
  const basePayload: EntityWritePayload = {
    tenant_id: context.tenantId,
  };

  const companyId = getRequiredCompanyId(entity.scope, context);

  if (companyId) {
    basePayload.company_id = companyId;
  }

  return basePayload;
}

export function castEntityRecord(data: unknown): EntityRecord | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as EntityRecord;
}

export function castEntityRecords(data: unknown): EntityRecord[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(
    (record): record is EntityRecord =>
      Boolean(record) && typeof record === "object" && !Array.isArray(record)
  );
}

export function castDeletedIds(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((record) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        return null;
      }

      const id = (record as { id?: unknown }).id;

      return typeof id === "string" ? id : null;
    })
    .filter((id): id is string => Boolean(id));
}
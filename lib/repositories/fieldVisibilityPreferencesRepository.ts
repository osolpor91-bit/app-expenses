import type { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  FieldVisibilityArea,
  FieldVisibilityPreference,
} from "@/lib/preferences/fieldVisibilityPreferences";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function applyNullableFilter<TQuery>({
  query,
  column,
  value,
}: {
  query: TQuery;
  column: string;
  value: string | null;
}) {
  if (value === null) {
    return (query as any).is(column, null) as TQuery;
  }

  return (query as any).eq(column, value) as TQuery;
}

export async function listFieldVisibilityPreferences({
  supabase,
  tenantId,
  companyId,
  userId,
  entityKey,
  area,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  companyId?: string | null;
  userId: string;
  entityKey?: string;
  area?: FieldVisibilityArea;
}) {
  let query = supabase
    .from("entity_field_visibility_preferences")
    .select(
      "id, tenant_id, company_id, user_id, entity_key, subform_key, field_key, area, hidden"
    )
    .eq("tenant_id", tenantId)
    .or(`user_id.is.null,user_id.eq.${userId}`);

  if (companyId) {
    query = query.or(`company_id.is.null,company_id.eq.${companyId}`);
  } else {
    query = query.is("company_id", null);
  }

  if (entityKey) {
    query = query.eq("entity_key", entityKey);
  }

  if (area) {
    query = query.eq("area", area);
  }

  return query.returns<FieldVisibilityPreference[]>();
}

export async function replaceFieldVisibilityPreferences({
  supabase,
  tenantId,
  companyId,
  userId,
  entityKey,
  subformKey,
  area,
  rows,
}: {
  supabase: SupabaseServerClient;
  tenantId: string;
  companyId: string | null;
  userId: string | null;
  entityKey: string;
  subformKey: string | null;
  area: FieldVisibilityArea;
  rows: Omit<FieldVisibilityPreference, "id">[];
}) {
  let deleteQuery = supabase
    .from("entity_field_visibility_preferences")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("entity_key", entityKey)
    .eq("area", area);

  deleteQuery = applyNullableFilter({
    query: deleteQuery,
    column: "company_id",
    value: companyId,
  });

  deleteQuery = applyNullableFilter({
    query: deleteQuery,
    column: "user_id",
    value: userId,
  });

  deleteQuery = applyNullableFilter({
    query: deleteQuery,
    column: "subform_key",
    value: subformKey,
  });

  const deleteResult = await deleteQuery;

  if (deleteResult.error) {
    return {
      data: null,
      error: deleteResult.error,
    };
  }

  if (rows.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  return supabase
    .from("entity_field_visibility_preferences")
    .insert(rows)
    .select(
      "id, tenant_id, company_id, user_id, entity_key, subform_key, field_key, area, hidden"
    )
    .returns<FieldVisibilityPreference[]>();
}
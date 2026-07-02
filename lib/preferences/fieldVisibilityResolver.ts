import type { EntityDefinition } from "@/lib/entities/core/entityDefinition";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import { getFieldVisibilityTarget } from "@/lib/preferences/fieldVisibilityConfiguration";
import {
  applyFieldVisibilityPreferences,
  type FieldVisibilityArea,
} from "@/lib/preferences/fieldVisibilityPreferences";
import { listFieldVisibilityPreferences } from "@/lib/repositories/fieldVisibilityPreferencesRepository";

export async function getVisibleFieldKeysForArea({
  supabase,
  entity,
  context,
  userId,
  area,
  subformKey = null,
}: {
  supabase: SupabaseServerClient;
  entity: EntityDefinition;
  context: EntityScopeContext;
  userId: string;
  area: FieldVisibilityArea;
  subformKey?: string | null;
}) {
  const target = getFieldVisibilityTarget({
    entity,
    area,
    subformKey,
  });

  if (!target) {
    return [];
  }

  const { data, error } = await listFieldVisibilityPreferences({
    supabase,
    tenantId: context.tenantId,
    companyId: context.companyId ?? null,
    userId,
    entityKey: entity.key,
    area,
  });

  if (error) {
    throw new Error(
      `Error leyendo preferencias de campos de ${entity.key}: ${error.message}`
    );
  }

  const visibleFields = applyFieldVisibilityPreferences({
    fields: target.fields,
    preferences: data ?? [],
    context: {
      tenantId: context.tenantId,
      companyId: context.companyId ?? null,
      userId,
      entityKey: entity.key,
      subformKey,
      area,
    },
  });

  return visibleFields.map((field) => field.key);
}
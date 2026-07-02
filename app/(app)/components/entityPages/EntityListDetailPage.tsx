import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { requireTenant } from "@/lib/auth/requireTenant";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import {
  castEntityRecords,
  listEntityRecords,
  type EntityScopeContext,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  getEntityDictionarySection,
  getEntityFieldLabels,
} from "@/lib/entities/core/entityLabels";
import { mapEntityRecordsRelations } from "@/lib/entities/core/entityRelations";
import { getDictionary } from "@/lib/i18n/server";
import { applyBaseUnitInventoryToItems } from "@/lib/items/inventory";
import {
  getEntityFilterParamNames,
  getFilterValues,
  type EntityFilterDefinition,
} from "@/lib/search/databaseFilters";
import { getFieldsForList } from "@/lib/entityFields/helpers";
import { applyFieldVisibilityPreferences } from "@/lib/preferences/fieldVisibilityPreferences";
import { listFieldVisibilityPreferences } from "@/lib/repositories/fieldVisibilityPreferencesRepository";

import FilterBar from "../FilterBar";
import EntityListDetailPageClient from "./EntityListDetailPageClient";

type EntityListDetailPageProps = {
  entity: ListDetailEntityDefinition;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  minWidthClass?: string;
};

type EntityListPageContext = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  userId: string;
  scopeAvailable: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(
  source: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const value = source[key];

  return typeof value === "string" ? value : fallback;
}

function getSection(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const value = source[key];

  return isRecord(value) ? value : {};
}

async function getEntityListPageContext(
  entity: ListDetailEntityDefinition
): Promise<EntityListPageContext> {
  if (entity.scope === "company") {
    const { supabase, user, tenant, activeCompany } =
      await requireCompanyContext();

    return {
      supabase,
      context: {
        tenantId: tenant.id,
        companyId: activeCompany?.id ?? null,
      },
      userId: user.id,
      scopeAvailable: Boolean(activeCompany),
    };
  }

  const { supabase, user, tenant } = await requireTenant();

  return {
    supabase,
    context: {
      tenantId: tenant.id,
    },
    userId: user.id,
    scopeAvailable: true,
  };
}

function buildOptionFilterField({
  entity,
  filter,
  label,
  entityLabels,
  commonLabels,
}: {
  entity: ListDetailEntityDefinition;
  filter: EntityFilterDefinition;
  label: string;
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
}) {
  const entityField = entity.fields.find(
    (field) => field.dbName === filter.column
  );

  if (entityField?.type !== "option" || !entityField.options?.length) {
    return null;
  }

  return {
    type: "select" as const,
    name: filter.paramName,
    label,
    allLabel: getString(commonLabels, "all", "Todos"),
    multiple: true,
    options: entityField.options
      .filter((option) => option.value !== "")
      .map((option) => ({
        value: option.value,
        label: getString(
          entityLabels,
          option.labelKey,
          getString(commonLabels, option.labelKey, option.value)
        ),
      })),
  };
}

function buildFilterFields({
  entity,
  entityLabels,
  commonLabels,
}: {
  entity: ListDetailEntityDefinition;
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
}) {
  return (entity.filters ?? []).map((filter) => {
    const label = getString(
      entityLabels,
      filter.labelKey,
      getString(commonLabels, filter.labelKey, filter.paramName)
    );

    if (filter.type === "boolean") {
      return {
        type: "select" as const,
        name: filter.paramName,
        label,
        allLabel: getString(commonLabels, "all", "Todos"),
        options: [
          {
            value: "true",
            label: getString(commonLabels, "yes", "Sí"),
          },
          {
            value: "false",
            label: getString(commonLabels, "no", "No"),
          },
        ],
      };
    }

    if (filter.type === "dateRange") {
      return {
        type: "dateRange" as const,
        name: filter.paramName,
        label,
        placeholder: "01/01/2026..31/01/2026",
      };
    }

    const optionFilterField = buildOptionFilterField({
      entity,
      filter,
      label,
      entityLabels,
      commonLabels,
    });

    if (optionFilterField) {
      return optionFilterField;
    }

    return {
      type: "text" as const,
      name: filter.paramName,
      label,
      placeholder: label,
    };
  });
}

function getEntitySpecificRecordDeletedLabel(
  entity: ListDetailEntityDefinition,
  entityLabels: Record<string, unknown>
) {
  const singularKey = entity.key.endsWith("s")
    ? entity.key.slice(0, -1)
    : entity.key;

  const specificKey = `${singularKey}Deleted`;
  const specificValue = entityLabels[specificKey];

  if (typeof specificValue === "string") {
    return specificValue;
  }

  const recordDeleted = entityLabels.recordDeleted;

  if (typeof recordDeleted === "string") {
    return recordDeleted;
  }

  const supplierDeleted = entityLabels.supplierDeleted;

  if (typeof supplierDeleted === "string") {
    return supplierDeleted;
  }

  return "Registro eliminado correctamente.";
}

function getSelectRecordToDeleteLabel(entityLabels: Record<string, unknown>) {
  const selectRecordToDelete = entityLabels.selectRecordToDelete;

  if (typeof selectRecordToDelete === "string") {
    return selectRecordToDelete;
  }

  const selectSupplierToDelete = entityLabels.selectSupplierToDelete;

  if (typeof selectSupplierToDelete === "string") {
    return selectSupplierToDelete;
  }

  return "Selecciona un registro para eliminar.";
}

function buildClientLabels({
  entity,
  entityLabels,
  commonLabels,
}: {
  entity: ListDetailEntityDefinition;
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
}) {
  return {
    ...Object.fromEntries(
      Object.entries(entityLabels).filter(
        ([, value]) => typeof value === "string"
      )
    ),
    yes: getString(commonLabels, "yes", "Sí"),
    no: getString(commonLabels, "no", "No"),

    title: getString(entityLabels, "title", entity.key),
    emptyList: getString(entityLabels, "emptyList", "No hay registros."),
    listHelpText: getString(
      entityLabels,
      "listHelpText",
      "Selecciona una línea para abrir la ficha."
    ),

    new: getString(commonLabels, "new", "Nuevo"),
    edit: getString(commonLabels, "edit", "Editar"),
    delete: getString(commonLabels, "delete", "Eliminar"),
    deleting: getString(commonLabels, "deleting", "Eliminando..."),

    actions: getString(commonLabels, "actions", "Acciones"),
    noActionsAvailable: getString(
      commonLabels,
      "noActionsAvailable",
      "No hay acciones disponibles"
    ),

    selectRecordToDelete: getSelectRecordToDeleteLabel(entityLabels),
    confirmDelete: getString(
      entityLabels,
      "confirmDelete",
      "¿Seguro que quieres eliminar \"{name}\"?"
    ),
    deleteError: getString(entityLabels, "deleteError", "Error al eliminar"),
    noRowsDeleted: getString(
      entityLabels,
      "noRowsDeleted",
      "No se ha eliminado ningún registro."
    ),
    recordDeleted: getEntitySpecificRecordDeletedLabel(entity, entityLabels),
    scopeUnavailableMessage: getString(
      entityLabels,
      "noActiveCompanyDescription",
      "No hay un contexto activo para esta entidad."
    ),
  };
}

async function getVisibleListFieldKeys({
  entity,
  supabase,
  context,
  userId,
}: {
  entity: ListDetailEntityDefinition;
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  userId: string;
}) {
  const { data, error } = await listFieldVisibilityPreferences({
    supabase,
    tenantId: context.tenantId,
    companyId: context.companyId ?? null,
    userId,
    entityKey: entity.key,
    area: "list",
  });

  if (error) {
    throw new Error(
      `Error leyendo preferencias de campos de ${entity.key}: ${error.message}`
    );
  }

  const visibleFields = applyFieldVisibilityPreferences({
    fields: getFieldsForList(entity.fields),
    preferences: data ?? [],
    context: {
      tenantId: context.tenantId,
      companyId: context.companyId ?? null,
      userId,
      entityKey: entity.key,
      area: "list",
    },
  });

  return visibleFields.map((field) => field.key);
}

async function getEntityRecords({
  entity,
  supabase,
  context,
  searchParams,
  scopeAvailable,
}: {
  entity: ListDetailEntityDefinition;
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  searchParams: Record<string, string | string[] | undefined>;
  scopeAvailable: boolean;
}) {
  if (!scopeAvailable) {
    return [];
  }

  const { data, error } = await listEntityRecords({
    supabase,
    entity,
    context,
    searchParams,
  });

  if (error) {
    throw new Error(`Error leyendo ${entity.key}: ${error.message}`);
  }

  return castEntityRecords(data ?? []);
}

export default async function EntityListDetailPage({
  entity,
  searchParams,
  minWidthClass,
}: EntityListDetailPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { dict } = await getDictionary();

  const entityLabels = getEntityDictionarySection(entity, dict);
  const fieldLabels = getEntityFieldLabels(entity, dict);
  const commonLabels = getSection(dict, "common");

  const { supabase, context, userId, scopeAvailable } =
    await getEntityListPageContext(entity);

  const records = await getEntityRecords({
    entity,
    supabase,
    context,
    searchParams: resolvedSearchParams,
    scopeAvailable,
  });

  const recordsWithCalculatedInventory =
    entity.key === "items"
      ? await applyBaseUnitInventoryToItems({
          records,
          supabase,
          context,
        })
      : records;

  const mappedRecords = mapEntityRecordsRelations(
    entity,
    recordsWithCalculatedInventory
  );

  const visibleListFieldKeys = await getVisibleListFieldKeys({
    entity,
    supabase,
    context,
    userId,
  });

  const primaryFilterFields = [
    {
      type: "text" as const,
      name: "search",
      label: getString(commonLabels, "search", "Buscar"),
      placeholder: getString(commonLabels, "searchPlaceholder", "Buscar..."),
    },
  ];

  const secondaryFilterFields = buildFilterFields({
    entity,
    entityLabels,
    commonLabels,
  });

  const initialFilterValues = getFilterValues(
    resolvedSearchParams,
    getEntityFilterParamNames(entity.filters)
  );

  return (
    <section className="space-y-3">
      <div className="sticky top-14 z-[90] -mx-4 bg-app px-4 pb-1 pt-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-1 bg-app pb-0.5">
          <h1 className="text-base font-semibold leading-tight text-primary-app">
            {getString(entityLabels, "title", entity.key)}
          </h1>

          <FilterBar
            primaryFields={primaryFilterFields}
            secondaryFields={secondaryFilterFields}
            initialValues={initialFilterValues}
            labels={{
              apply: getString(commonLabels, "apply", "Aplicar"),
              clear: getString(commonLabels, "clear", "Limpiar"),
              filters: getString(commonLabels, "filters", "Filtros"),
              hideFilters: getString(
                commonLabels,
                "hideFilters",
                "Ocultar filtros"
              ),
              invalidDateRange: getString(
                commonLabels,
                "invalidDateRange",
                "Formato de fecha no válido. Usa 01/01/2026..31/01/2026."
              ),
            }}
          />
        </div>
      </div>

      <EntityListDetailPageClient
        entity={entity}
        records={mappedRecords}
        fieldLabels={fieldLabels}
        visibleListFieldKeys={visibleListFieldKeys}
        labels={buildClientLabels({
          entity,
          entityLabels,
          commonLabels,
        })}
        listActions={entity.listActions}
        minWidthClass={minWidthClass}
        scopeAvailable={scopeAvailable}
      />
    </section>
  );
}

import type { ReactNode } from "react";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { requireTenant } from "@/lib/auth/requireTenant";
import type {
  EditableGridEntityDefinition,
  EntityRecord,
} from "@/lib/entities/core/entityDefinition";
import {
  castEntityRecords,
  listEntityRecords,
  type EntityScopeContext,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  getEntityDictionarySection,
  getEntityFieldLabels,
  getEntityValidationMessages,
} from "@/lib/entities/core/entityLabels";
import {
  loadEntityRelationOptions,
  mapEntityRecordsRelations,
} from "@/lib/entities/core/entityRelations";
import { getDictionary } from "@/lib/i18n/server";
import {
  getEntityFilterParamNames,
  getFilterValues,
} from "@/lib/search/databaseFilters";

import FilterBar from "../FilterBar";
import EntityEditableGridPageClient from "./EntityEditableGridPageClient";

type EntityEditableGridPageProps = {
  entity: EditableGridEntityDefinition;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  viewActions?: ReactNode;
  minWidthClass?: string;
};

type EntityPageContext = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
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

async function getEntityPageContext(
  entity: EditableGridEntityDefinition
): Promise<EntityPageContext> {
  if (entity.scope === "company") {
    const { supabase, tenant, activeCompany } = await requireCompanyContext();

    if (!activeCompany) {
      throw new Error("Esta entidad requiere una empresa activa.");
    }

    return {
      supabase,
      context: {
        tenantId: tenant.id,
        companyId: activeCompany.id,
      },
    };
  }

  const { supabase, tenant } = await requireTenant();

  return {
    supabase,
    context: {
      tenantId: tenant.id,
    },
  };
}

function buildFilterFields({
  entity,
  entityLabels,
  commonLabels,
}: {
  entity: EditableGridEntityDefinition;
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
}) {
  return (entity.filters ?? []).map((filter) => {
    const label = getString(entityLabels, filter.labelKey, filter.paramName);

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

    return {
      type: "text" as const,
      name: filter.paramName,
      label,
      placeholder: label,
    };
  });
}

function getGridLabels(
  entityLabels: Record<string, unknown>
): Record<string, unknown> {
  return getSection(entityLabels, "grid");
}

function buildClientLabels({
  entityLabels,
  commonLabels,
  listLabels,
}: {
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
  listLabels: Record<string, unknown>;
}) {
  const gridLabels = getGridLabels(entityLabels);

  return {
    yes: getString(commonLabels, "yes", "Sí"),
    no: getString(commonLabels, "no", "No"),

    emptyList: getString(entityLabels, "emptyList", "No hay registros."),
    errorRefreshing: getString(
      entityLabels,
      "errorRefreshing",
      "Error al refrescar registros"
    ),

    actions: getString(commonLabels, "actions", "Acciones"),
    noActionsAvailable: getString(
      commonLabels,
      "noActionsAvailable",
      "No hay acciones disponibles"
    ),
    editList: getString(listLabels, "editList", "Editar lista"),
    viewList: getString(listLabels, "viewList", "Ver lista"),
    loading: getString(commonLabels, "loading", "Cargando..."),

    validationMessages: {},

    grid: {
      deleteSelected: getString(
        gridLabels,
        "deleteSelected",
        "Eliminar seleccionados"
      ),
      selectedSuffix: getString(gridLabels, "selectedSuffix", "seleccionados"),
      helpText: getString(
        gridLabels,
        "helpText",
        "Edita los datos directamente en la lista."
      ),
      createRequiredFields: getString(
        gridLabels,
        "createRequiredFields",
        "Informa los campos obligatorios para crear el registro."
      ),
      requiredFields: getString(
        gridLabels,
        "requiredFields",
        "Informa los campos obligatorios."
      ),
      saveError: getString(gridLabels, "saveError", "Error al guardar"),
      createError: getString(gridLabels, "createError", "Error al crear"),
      deleteError: getString(gridLabels, "deleteError", "Error al eliminar"),
      countryCreated: getString(gridLabels, "countryCreated", ""),
      companyCreated: getString(gridLabels, "companyCreated", ""),
      recordCreated: getString(gridLabels, "recordCreated", "Registro creado."),
      changeSaved: getString(gridLabels, "changeSaved", "Cambio guardado."),
      selectAtLeastOneToDelete: getString(
        gridLabels,
        "selectAtLeastOneToDelete",
        "Selecciona al menos un registro para eliminar."
      ),
      confirmDelete: getString(
        gridLabels,
        "confirmDelete",
        "¿Eliminar {count} registros?"
      ),
      noRowsDeleted: getString(
        gridLabels,
        "noRowsDeleted",
        "No se ha eliminado ningún registro."
      ),
      countriesDeleted: getString(gridLabels, "countriesDeleted", ""),
      companiesDeleted: getString(gridLabels, "companiesDeleted", ""),
      recordsDeleted: getString(
        gridLabels,
        "recordsDeleted",
        "Registros eliminados."
      ),
      invalidRelation: getString(
        gridLabels,
        "invalidRelation",
        "El valor seleccionado no es válido."
      ),
    },
  };
}

export default async function EntityEditableGridPage({
  entity,
  searchParams,
  viewActions,
  minWidthClass,
}: EntityEditableGridPageProps) {
  const { dict } = await getDictionary();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const entityLabels = getEntityDictionarySection(entity, dict);
  const commonLabels = getSection(dict, "common");
  const listLabels = getSection(dict, "list");

  const filterValues = getFilterValues(
    resolvedSearchParams,
    getEntityFilterParamNames(entity.filters)
  );

  const { supabase, context } = await getEntityPageContext(entity);

  const { data, error } = await listEntityRecords({
    supabase,
    entity,
    context,
    searchParams: resolvedSearchParams,
  });

  if (error) {
    throw new Error(
      `${getString(entityLabels, "errorReading", "Error al leer registros")}: ${error.message
      }`
    );
  }

  const relationOptionsByField = await loadEntityRelationOptions({
    supabase,
    entity,
    context,
  });

  const clientLabels = buildClientLabels({
    entityLabels,
    commonLabels,
    listLabels,
  });

  clientLabels.validationMessages = getEntityValidationMessages(entity, dict);

  const secondaryFields = buildFilterFields({
    entity,
    entityLabels,
    commonLabels,
  });

  const records = mapEntityRecordsRelations(
    entity,
    castEntityRecords(data) as EntityRecord[]
  );

  return (
    <section className="space-y-3">
      <div className="sticky top-14 z-[90] -mx-4 bg-app px-4 pb-1 pt-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-1 bg-app pb-0.5">
          <h1 className="text-base font-semibold leading-tight text-primary-app">
            {getString(entityLabels, "title", entity.key)}
          </h1>

          <FilterBar
            initialValues={filterValues}
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
            primaryFields={[
              {
                type: "text",
                name: "search",
                label: getString(commonLabels, "search", "Buscar"),
                placeholder: getString(
                  commonLabels,
                  "searchPlaceholder",
                  "Buscar..."
                ),
              },
            ]}
            secondaryFields={secondaryFields}
          />
        </div>
      </div>

      <EntityEditableGridPageClient
        entity={entity}
        tenantId={context.tenantId}
        records={records}
        filters={filterValues}
        relationOptionsByField={relationOptionsByField}
        fieldLabels={getEntityFieldLabels(entity, dict)}
        labels={clientLabels}
        viewActions={viewActions}
        minWidthClass={minWidthClass}
      />
    </section>
  );
}
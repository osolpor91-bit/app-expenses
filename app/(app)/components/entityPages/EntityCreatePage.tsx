import { requireTenant } from "@/lib/auth/requireTenant";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import {
  getEntityDictionarySection,
  getEntityFieldLabels,
  getEntityFormLayoutLabels,
  getEntityValidationMessages,
} from "@/lib/entities/core/entityLabels";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import { loadEntityRelationOptions } from "@/lib/entities/core/entityRelations";
import { getDictionary } from "@/lib/i18n/server";
import { loadPurchaseLineSourceOptions } from "@/lib/purchaseLines/purchaseLineLookups";

import EntityListDetailForm from "./EntityListDetailForm";

import { getVisibleFieldKeysForArea } from "@/lib/preferences/fieldVisibilityResolver";

type EntityCreatePageProps = {
  entity: ListDetailEntityDefinition;
};

type EntityCreatePageContext = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  userId: string;
  activeCompany?: Record<string, unknown> | null;
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

function hasPurchaseLineSourceDynamicSelect(entity: ListDetailEntityDefinition) {
  return entity.fields.some(
    (field) => field.dynamicSelectOptions?.source === "purchaseLineSources"
  );
}

async function getEntityCreatePageContext(
  entity: ListDetailEntityDefinition
): Promise<EntityCreatePageContext> {
  if (entity.scope === "company") {
    const { supabase, user, tenant, activeCompany } = await requireCompanyContext();

    if (!activeCompany) {
      throw new Error("Esta entidad requiere una empresa activa.");
    }

    return {
      supabase,
      context: {
        tenantId: tenant.id,
        companyId: activeCompany.id,
      },
      userId: user.id,
      activeCompany: activeCompany as unknown as Record<string, unknown>,
    };
  }

  const { supabase, user, tenant } = await requireTenant();

  return {
    supabase,
    context: {
      tenantId: tenant.id,
    },
    userId: user.id,
    activeCompany: null,
  };
}

function buildSelectPlaceholderByField(
  entityLabels: Record<string, unknown>
): Record<string, string> {
  const placeholders: Record<string, string> = {};

  const selectCountry = entityLabels.selectCountry;

  if (typeof selectCountry === "string") {
    placeholders.country_id = selectCountry;
  }

  return placeholders;
}

function buildFormLabels({
  entityLabels,
  commonLabels,
  validationMessages,
  formLayoutLabels,
}: {
  entityLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
  validationMessages: Record<string, unknown>;
  formLayoutLabels: Record<string, string>;
}) {
  return {
    fieldRequired: getString(
      commonLabels,
      "fieldRequired",
      "El campo {field} es obligatorio."
    ),
    save: getString(commonLabels, "save", "Guardar"),
    saving: getString(commonLabels, "saving", "Guardando..."),
    cancel: getString(commonLabels, "cancel", "Cancelar"),
    createError: getString(entityLabels, "createError", "Error al crear"),
    saveError: getString(entityLabels, "saveError", "Error al guardar"),
    noRecordId: getString(
      entityLabels,
      "noRecordId",
      "No se ha encontrado el registro."
    ),
    recordSaved: getString(entityLabels, "recordSaved", "Registro guardado."),
    autoCreateHint: getString(
      commonLabels,
      "autoCreateHint",
      "Completa los campos obligatorios para crear el registro automáticamente."
    ),
    validationMessages,
    formLayoutLabels,
    selectPlaceholderByField: buildSelectPlaceholderByField(entityLabels),
  };
}

function buildCreateInitialRecord({
  entity,
  activeCompany,
}: {
  entity: ListDetailEntityDefinition;
  activeCompany?: Record<string, unknown> | null;
}) {
  const record = entity.fields.reduce<Record<string, string | boolean | number | null>>(
    (currentRecord, field) => {
      if (field.newRowDefaultValue !== undefined) {
        currentRecord[field.dbName] = field.newRowDefaultValue;
      }

      if (
        field.createDefaultValueFromActiveCompanyDbName &&
        activeCompany
      ) {
        const companyValue =
          activeCompany[field.createDefaultValueFromActiveCompanyDbName];

        if (
          typeof companyValue === "string" ||
          typeof companyValue === "number" ||
          typeof companyValue === "boolean" ||
          companyValue === null
        ) {
          currentRecord[field.dbName] = companyValue;
        }
      }

      return currentRecord;
    },
    {}
  );

  return Object.keys(record).length > 0 ? record : undefined;
}

export default async function EntityCreatePage({
  entity,
}: EntityCreatePageProps) {
  const { dict } = await getDictionary();
  const { supabase, context, userId, activeCompany } =
    await getEntityCreatePageContext(entity);

  const entityLabels = getEntityDictionarySection(entity, dict);
  const commonLabels = getSection(dict, "common");

  const relationOptionsByField = await loadEntityRelationOptions({
    supabase,
    entity,
    context,
  });
  const purchaseLineSourceOptionsByType = hasPurchaseLineSourceDynamicSelect(
    entity
  )
    ? await loadPurchaseLineSourceOptions({
        supabase,
        context,
      })
    : null;
  const visibleFormFieldKeys = await getVisibleFieldKeysForArea({
    supabase,
    entity,
    context,
    userId,
    area: "form",
  });

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {getString(
            entityLabels,
            "createTitle",
            getString(entityLabels, "newTitle", entity.key)
          )}
        </h1>
      </div>

      <EntityListDetailForm
        entity={entity}
        mode="create"
        record={buildCreateInitialRecord({
          entity,
          activeCompany,
        })}
        relationOptionsByField={relationOptionsByField}
        purchaseLineSourceOptionsByType={purchaseLineSourceOptionsByType}
        fieldLabels={getEntityFieldLabels(entity, dict)}
        visibleFormFieldKeys={visibleFormFieldKeys}
        formContextValues={{
          activeCompanyCurrencyCode:
            typeof activeCompany?.currency_code === "string"
              ? activeCompany.currency_code
              : null,
        }}
        labels={buildFormLabels({
          entityLabels,
          commonLabels,
          validationMessages: getEntityValidationMessages(entity, dict),
          formLayoutLabels: getEntityFormLayoutLabels(entity, dict),
        })}
      />
    </section>
  );
}

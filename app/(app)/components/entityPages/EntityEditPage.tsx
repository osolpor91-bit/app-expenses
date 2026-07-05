import { notFound } from "next/navigation";

import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import { getFieldOptionLabel } from "@/lib/entityFields/helpers";
import { requireTenant } from "@/lib/auth/requireTenant";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import type {
  EntityFactBoxDefinition,
  EntityRecord,
  EntityRecordSummaryFactBoxDefinition,
  EntitySubformDefinition,
  ListDetailEntityDefinition,
} from "@/lib/entities/core/entityDefinition";
import {
  castEntityRecord,
  castEntityRecords,
  getEntityRecordById,
  type EntityScopeContext,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  getEntityDictionarySection,
  getEntityFieldLabels,
  getEntityFormLayoutLabels,
  getEntitySubformDictionarySection,
  getEntitySubformFieldLabels,
  getEntitySubformValidationMessages,
  getEntityValidationMessages,
} from "@/lib/entities/core/entityLabels";
import {
  loadEntityRelationOptions,
  loadEntitySubformRelationOptions,
  mapEntityRecordRelations,
} from "@/lib/entities/core/entityRelations";
import { listEntitySubformRecords } from "@/lib/entities/core/entitySubformRepository";
import { formatFieldValueForDisplay } from "@/lib/formatters/fieldFormatters";
import { getDictionary } from "@/lib/i18n/server";
import {
  readItemBaseUnitInventory,
  normalizeUnitOfMeasure,
} from "@/lib/items/inventory";

import EmailConfigurationTools from "../../email-configurations/components/EmailConfigurationTools";
import EntityDocumentFactBox from "../EntityDocumentFactBox";
import EntityFactBox, { type EntityFactBoxRow } from "../EntityFactBox";
import EntitySubformGrid from "../EntitySubformGrid";
import EntityListDetailForm from "./EntityListDetailForm";
import EntityReturnButton from "./EntityReturnButton";

import { getVisibleFieldKeysForArea } from "@/lib/preferences/fieldVisibilityResolver";
import { loadPurchaseLineSourceOptions } from "@/lib/purchaseLines/purchaseLineLookups";

type EntityEditPageProps = {
  entity: ListDetailEntityDefinition;
  id: string;
};

type EntityEditPageContext = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  userId: string;
  activeCompanyCurrencyCode?: string | null;
  activeCompanyPurchaseDefaultLineType?: string | null;
};

type DocumentFactBoxLabels = {
  title: string;
  selectRecord: string;
  loading: string;
  empty: string;
  open: string;
  download: string;
  upload: string;
  uploading: string;
  delete: string;
  deleting: string;
  confirmDelete: string;
  fileTooLarge: string;
  uploadError: string;
  error: string;
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

async function getEntityEditPageContext(
  entity: ListDetailEntityDefinition
): Promise<EntityEditPageContext> {
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
      activeCompanyCurrencyCode: activeCompany.currency_code ?? null,
      activeCompanyPurchaseDefaultLineType:
        activeCompany.purchase_default_line_type ?? "item",
    };
  }

  const { supabase, user, tenant } = await requireTenant();

  return {
    supabase,
    context: {
      tenantId: tenant.id,
    },
    userId: user.id,
    activeCompanyCurrencyCode: null,
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
    validationMessages,
    formLayoutLabels,
    selectPlaceholderByField: buildSelectPlaceholderByField(entityLabels),
  };
}

function buildSubformLabels({
  subformLabels,
  commonLabels,
  validationMessages,
}: {
  subformLabels: Record<string, unknown>;
  commonLabels: Record<string, unknown>;
  validationMessages: Record<string, unknown>;
}) {
  return {
    title: getString(subformLabels, "title", "Líneas"),
    actions: getString(commonLabels, "actions", "Acciones"),
    addLine: getString(subformLabels, "addLine", "Añadir línea"),
    deleteLine: getString(subformLabels, "deleteLine", "Eliminar"),
    deleteSelectedLine: getString(subformLabels, "deleteSelectedLine", "Borrar"),
    deleteAllLines: getString(subformLabels, "deleteAllLines", "Borrar todas"),
    selectLineToDelete: getString(
      subformLabels,
      "selectLineToDelete",
      "Selecciona una línea para borrar."
    ),
    confirmDeleteAll: getString(
      subformLabels,
      "confirmDeleteAll",
      "Vas a borrar todas las líneas. Esta acción no se puede deshacer. ¿Quieres continuar?"
    ),
    recordsDeleted: getString(
      subformLabels,
      "recordsDeleted",
      "Líneas borradas correctamente."
    ),
    empty: getString(subformLabels, "empty", "No hay líneas."),
    saving: getString(commonLabels, "saving", "Guardando..."),
    saveError: getString(subformLabels, "saveError", "Error al guardar"),
    deleteError: getString(subformLabels, "deleteError", "Error al eliminar"),
    recordSaved: getString(subformLabels, "recordSaved", "Línea guardada."),
    confirmDelete: getString(
      subformLabels,
      "confirmDelete",
      "¿Seguro que quieres eliminar esta línea?"
    ),
    fieldRequired: getString(
      commonLabels,
      "fieldRequired",
      "El campo {field} es obligatorio."
    ),
    validationMessages,
  };
}
function buildEmailConfigurationToolsLabels(
  emailConfigurationLabels: Record<string, unknown>
) {
  return {
    smtpPasswordTitle: getString(
      emailConfigurationLabels,
      "smtpPasswordTitle",
      "Contraseña SMTP"
    ),
    smtpPasswordDescription: getString(
      emailConfigurationLabels,
      "smtpPasswordDescription",
      "La contraseña SMTP no se muestra en la ficha. Informa una nueva contraseña solo cuando quieras cambiarla."
    ),
    smtpPasswordPlaceholder: getString(
      emailConfigurationLabels,
      "smtpPasswordPlaceholder",
      "Nueva contraseña SMTP"
    ),
    saveSmtpPassword: getString(
      emailConfigurationLabels,
      "saveSmtpPassword",
      "Guardar contraseña SMTP"
    ),
    savingSmtpPassword: getString(
      emailConfigurationLabels,
      "savingSmtpPassword",
      "Guardando contraseña..."
    ),
    smtpPasswordSaved: getString(
      emailConfigurationLabels,
      "smtpPasswordSaved",
      "Contraseña SMTP guardada correctamente."
    ),

    microsoftSecretTitle: getString(
      emailConfigurationLabels,
      "microsoftSecretTitle",
      "Client secret Microsoft"
    ),
    microsoftSecretDescription: getString(
      emailConfigurationLabels,
      "microsoftSecretDescription",
      "Este secreto se usará más adelante para Microsoft 365 / Graph. No se muestra en la ficha."
    ),
    microsoftSecretPlaceholder: getString(
      emailConfigurationLabels,
      "microsoftSecretPlaceholder",
      "Nuevo client secret"
    ),
    saveMicrosoftSecret: getString(
      emailConfigurationLabels,
      "saveMicrosoftSecret",
      "Guardar client secret"
    ),
    savingMicrosoftSecret: getString(
      emailConfigurationLabels,
      "savingMicrosoftSecret",
      "Guardando client secret..."
    ),
    microsoftSecretSaved: getString(
      emailConfigurationLabels,
      "microsoftSecretSaved",
      "Client secret guardado correctamente."
    ),

    testTitle: getString(
      emailConfigurationLabels,
      "testTitle",
      "Enviar correo de prueba"
    ),
    testDescription: getString(
      emailConfigurationLabels,
      "testDescription",
      "Indica un correo destino para probar esta configuración. Actualmente la prueba solo envía mediante SMTP con usuario y contraseña."
    ),
    destinationEmail: getString(
      emailConfigurationLabels,
      "destinationEmail",
      "Correo destino"
    ),
    destinationEmailPlaceholder: getString(
      emailConfigurationLabels,
      "destinationEmailPlaceholder",
      "destino@empresa.com"
    ),
    sendTestEmail: getString(
      emailConfigurationLabels,
      "sendTestEmail",
      "Enviar prueba"
    ),
    sendingTestEmail: getString(
      emailConfigurationLabels,
      "sendingTestEmail",
      "Enviando prueba..."
    ),
    testEmailSent: getString(
      emailConfigurationLabels,
      "testEmailSent",
      "Correo de prueba enviado correctamente."
    ),
    requiredSecretError: getString(
      emailConfigurationLabels,
      "requiredSecretError",
      "Debes informar un valor antes de guardar."
    ),
  };
}

function buildDocumentFactBoxLabels(
  documentFactBoxLabels: Record<string, unknown>
): DocumentFactBoxLabels {
  return {
    title: getString(documentFactBoxLabels, "title", "Adjunto"),
    selectRecord: getString(
      documentFactBoxLabels,
      "selectRecord",
      "Selecciona un registro para ver su adjunto."
    ),
    loading: getString(
      documentFactBoxLabels,
      "loading",
      "Cargando adjunto..."
    ),
    empty: getString(
      documentFactBoxLabels,
      "empty",
      "Este registro no tiene adjunto."
    ),
    open: getString(documentFactBoxLabels, "open", "Abrir"),
    download: getString(documentFactBoxLabels, "download", "Descargar"),
    upload: getString(documentFactBoxLabels, "upload", "Cargar"),
    uploading: getString(documentFactBoxLabels, "uploading", "Cargando..."),
    delete: getString(documentFactBoxLabels, "delete", "Eliminar"),
    deleting: getString(documentFactBoxLabels, "deleting", "Eliminando..."),
    confirmDelete: getString(
      documentFactBoxLabels,
      "confirmDelete",
      "Vas a eliminar este adjunto. Esta acción no se puede deshacer. ¿Quieres continuar?"
    ),
    fileTooLarge: getString(
      documentFactBoxLabels,
      "fileTooLarge",
      "El archivo no puede superar los 10 MB."
    ),
    uploadError: getString(
      documentFactBoxLabels,
      "uploadError",
      "No se pudo subir el archivo. Comprueba la conexión e inténtalo de nuevo."
    ),
    error: getString(documentFactBoxLabels, "error", "Error"),
  };
}

function getFieldLabel(
  fieldLabels: Record<string, string>,
  field: EntityFieldDefinition
) {
  return fieldLabels[field.dbName] ?? fieldLabels[field.key] ?? field.labelKey;
}

function getDisplayFieldName(field: EntityFieldDefinition) {
  return field.relation?.displayFieldName ?? field.dbName;
}

function getRecordDisplayValue(
  record: EntityRecord,
  field: EntityFieldDefinition,
  fieldLabels: Record<string, string>
) {
  const fieldName = field.relation ? getDisplayFieldName(field) : field.dbName;
  const value = record[fieldName];

  if (field.relation) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return String(value);
  }

  if (field.type === "option") {
    return getFieldOptionLabel({
      field,
      value,
      fieldLabels,
    });
  }

  return formatFieldValueForDisplay(field, value);
}

function getFormRecordData(
  entity: ListDetailEntityDefinition,
  record: EntityRecord
) {
  const formRecord: Record<string, string | boolean | number | null | undefined> =
  {
    id: record.id,
    tenant_id: record.tenant_id,
  };

  if (record.company_id) {
    formRecord.company_id = record.company_id;
  }

  entity.fields
    .filter((field) => field.showInForm)
    .forEach((field) => {
      const value = record[field.dbName];

      if (typeof value === "string") {
        formRecord[field.dbName] = value;
        return;
      }

      if (typeof value === "number") {
        formRecord[field.dbName] = value;
        return;
      }

      if (typeof value === "boolean") {
        formRecord[field.dbName] = value;
        return;
      }

      if (value === null) {
        formRecord[field.dbName] = null;
        return;
      }

      formRecord[field.dbName] = undefined;
    });

  return formRecord;
}

function getFactBoxRows({
  entity,
  record,
  fieldLabels,
}: {
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
}): EntityFactBoxRow[] {
  return entity.fields
    .filter((field) => field.showInFactBox)
    .map((field) => ({
      label: getFieldLabel(fieldLabels, field),
      value: getRecordDisplayValue(record, field, fieldLabels),
    }));
}

function getRecordSummaryFactBoxRows({
  entity,
  record,
  fieldLabels,
  factBox,
}: {
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
  factBox: EntityRecordSummaryFactBoxDefinition;
}): EntityFactBoxRow[] {
  const allowedFieldNames = factBox.fieldDbNames
    ? new Set(factBox.fieldDbNames)
    : null;

  return entity.fields
    .filter((field) => {
      if (!allowedFieldNames) {
        return field.showInFactBox;
      }

      return allowedFieldNames.has(field.dbName) || allowedFieldNames.has(field.key);
    })
    .map((field) => ({
      label: getFieldLabel(fieldLabels, field),
      value: getRecordDisplayValue(record, field, fieldLabels),
    }));
}

function getPrimaryTitle({
  entity,
  record,
  fieldLabels,
}: {
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
}) {
  const primaryField = entity.fields.find(
    (field) => field.dbName === entity.primaryFieldDbName
  );

  const value = record[entity.primaryFieldDbName];

  if (!primaryField) {
    return String(value ?? "");
  }

  if (primaryField.type === "option") {
    return getFieldOptionLabel({
      field: primaryField,
      value,
      fieldLabels,
    });
  }

  return formatFieldValueForDisplay(primaryField, value);
}

function replaceTemplateTokens(template: string, record: EntityRecord) {
  return template.replace(/\{([^}]+)\}/g, (_match, token: string) => {
    const dbName = token
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();

    return String(record[dbName] ?? "");
  });
}

function getEditSubtitle({
  entityLabels,
  record,
}: {
  entityLabels: Record<string, unknown>;
  record: EntityRecord;
}) {
  const subtitle = entityLabels.editSubtitle;

  if (typeof subtitle !== "string") {
    return "";
  }

  return replaceTemplateTokens(subtitle, record);
}

function getDefaultFactBoxes(): readonly EntityFactBoxDefinition[] {
  return [
    {
      key: "summary",
      type: "recordSummary",
      titleLabelKey: "factBoxTitle",
    },
    {
      key: "comingSoon",
      type: "staticText",
      titleLabelKey: "comingSoonTitle",
      textLabelKey: "comingSoonText",
    },
  ];
}

function renderConfiguredFactBox({
  factBox,
  entity,
  record,
  fieldLabels,
  entityLabels,
  documentFactBoxLabels,
}: {
  factBox: EntityFactBoxDefinition;
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
  entityLabels: Record<string, unknown>;
  documentFactBoxLabels: DocumentFactBoxLabels;
}) {
  if (factBox.type === "document") {
    return (
      <EntityDocumentFactBox
        key={factBox.key}
        entityKey={entity.key}
        recordId={record.id}
        factBoxKey={factBox.key}
        labels={documentFactBoxLabels}
      />
    );
  }

  if (factBox.type === "recordSummary") {
    return (
      <EntityFactBox
        key={factBox.key}
        title={getString(
          entityLabels,
          factBox.titleLabelKey ?? "factBoxTitle",
          "Resumen"
        )}
        rows={getRecordSummaryFactBoxRows({
          entity,
          record,
          fieldLabels,
          factBox,
        })}
      />
    );
  }

  if (factBox.type === "staticText") {
    return (
      <EntityFactBox
        key={factBox.key}
        title={getString(entityLabels, factBox.titleLabelKey, "Próximamente")}
      >
        <p className="mt-3 text-sm text-app-muted">
          {getString(
            entityLabels,
            factBox.textLabelKey,
            "Aquí podrás ver más información relacionada con este registro."
          )}
        </p>
      </EntityFactBox>
    );
  }

  return null;
}

function isPurchaseLineSubform({
  entity,
  subform,
}: {
  entity: ListDetailEntityDefinition;
  subform: EntitySubformDefinition;
}) {
  return entity.table === "purchases_header" && subform.table === "purchases_line";
}

function hasPurchaseLineSourceDynamicSelect(entity: ListDetailEntityDefinition) {
  return entity.fields.some(
    (field) => field.dynamicSelectOptions?.source === "purchaseLineSources"
  );
}

const purchaseTotalFieldDbNames = [
  "total_base_amount",
  "total_vat_amount",
  "total_amount",
] as const;

function isPurchaseDocumentEntity(entity: ListDetailEntityDefinition) {
  return entity.table === "purchases_header";
}

function getPurchaseTotalFields(entity: ListDetailEntityDefinition) {
  return purchaseTotalFieldDbNames
    .map((dbName) => entity.fields.find((field) => field.dbName === dbName))
    .filter((field): field is EntityFieldDefinition => Boolean(field));
}

function renderPurchaseTotalsSection({
  entity,
  record,
  fieldLabels,
  entityLabels,
}: {
  entity: ListDetailEntityDefinition;
  record: EntityRecord;
  fieldLabels: Record<string, string>;
  entityLabels: Record<string, unknown>;
}) {
  if (!isPurchaseDocumentEntity(entity)) {
    return null;
  }

  const totalFields = getPurchaseTotalFields(entity);

  if (totalFields.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-app bg-app-soft p-4">
      <h2 className="mb-4 text-sm font-semibold text-primary-app">
        {getString(entityLabels, "totalsSectionTitle", "Totales")}
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {totalFields.map((field) => (
          <div
            key={field.key}
            className="rounded-lg border border-app bg-app px-3 py-2"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
              {fieldLabels[field.dbName] ?? fieldLabels[field.key] ?? field.labelKey}
            </p>

            <p className="mt-1 text-lg font-semibold text-primary-app">
              {formatFieldValueForDisplay(field, record[field.dbName])}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function EntityEditPage({
  entity,
  id,
}: EntityEditPageProps) {
  const { dict } = await getDictionary();
  const {
    supabase,
    context,
    userId,
    activeCompanyCurrencyCode,
    activeCompanyPurchaseDefaultLineType,
  } = await getEntityEditPageContext(entity);

  const entityLabels = getEntityDictionarySection(entity, dict);
  const commonLabels = getSection(dict, "common");
  const documentFactBoxLabels = buildDocumentFactBoxLabels(
    getSection(dict, "documentFactBox")
  );
  const fieldLabels = getEntityFieldLabels(entity, dict);
  const validationMessages = getEntityValidationMessages(entity, dict);

  const { data, error } = await getEntityRecordById({
    supabase,
    entity,
    context,
    id,
  });

  if (error || !data) {
    notFound();
  }

  const entityRecord = castEntityRecord(data);

  if (!entityRecord) {
    notFound();
  }

  const recordWithCalculatedInventory =
    entity.key === "items"
      ? {
        ...entityRecord,
        inventory: await readItemBaseUnitInventory({
          supabase,
          context,
          itemId: entityRecord.id,
          baseUnitOfMeasure: normalizeUnitOfMeasure(
            entityRecord.base_unit_of_measure
          ),
        }),
      }
      : entityRecord;

  const record = mapEntityRecordRelations(entity, recordWithCalculatedInventory);
  const relationOptionsByField = await loadEntityRelationOptions({
    supabase,
    entity,
    context,
  });
  const formPurchaseLineSourceOptionsByType = hasPurchaseLineSourceDynamicSelect(
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

  const title = getPrimaryTitle({
    entity,
    record,
    fieldLabels,
  });
  const subtitle = getEditSubtitle({
    entityLabels,
    record,
  });

  const subformData = await Promise.all(
    (entity.subforms ?? []).map(async (subform) => {
      const { data: subformRecordsData, error: subformRecordsError } =
        await listEntitySubformRecords({
          supabase,
          subform,
          context,
          parentId: record.id,
        });

      if (subformRecordsError) {
        throw new Error(subformRecordsError.message);
      }

      const subformLabels = getEntitySubformDictionarySection(subform, dict);

      const visibleGridFieldKeys = await getVisibleFieldKeysForArea({
        supabase,
        entity,
        context,
        userId,
        area: "grid",
        subformKey: subform.key,
      });

      const subformRelationOptionsByField =
        await loadEntitySubformRelationOptions({
          supabase,
          subform,
          context,
        });

      const purchaseLineSourceOptionsByType = isPurchaseLineSubform({
        entity,
        subform,
      })
        ? await loadPurchaseLineSourceOptions({
          supabase,
          context,
        })
        : null;

      return {
        subform,
        records: castEntityRecords(subformRecordsData),
        fieldLabels: getEntitySubformFieldLabels(subform, dict),
        visibleGridFieldKeys,
        relationOptionsByField: subformRelationOptionsByField,
        purchaseLineSourceOptionsByType,
        labels: buildSubformLabels({
          subformLabels,
          commonLabels,
          validationMessages: getEntitySubformValidationMessages(subform, dict),
        }),
      };
    })
  );

  const factBoxes = entity.factBoxes ?? getDefaultFactBoxes();

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <EntityReturnButton label={getString(commonLabels, "back", "Volver")} />

        <a href={entity.route} className="link-app text-sm">
          ←{" "}
          {getString(
            entityLabels,
            "backToList",
            getString(entityLabels, "backToSuppliers", "Volver")
          )}
        </a>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {title || getString(entityLabels, "editTitle", entity.key)}
        </h1>

        {subtitle && <p className="mt-1 text-sm text-app-muted">{subtitle}</p>}
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <EntityListDetailForm
            entity={entity}
            mode="edit"
            record={getFormRecordData(entity, record)}
            relationOptionsByField={relationOptionsByField}
            purchaseLineSourceOptionsByType={formPurchaseLineSourceOptionsByType}
            fieldLabels={fieldLabels}
            visibleFormFieldKeys={visibleFormFieldKeys}
            formContextValues={{
              activeCompanyCurrencyCode,
            }}
            labels={buildFormLabels({
              entityLabels,
              commonLabels,
              validationMessages,
              formLayoutLabels: getEntityFormLayoutLabels(entity, dict),
            })}
          />

          {entity.key === "emailConfigurations" && (
            <EmailConfigurationTools
              recordId={record.id}
              labels={buildEmailConfigurationToolsLabels(entityLabels)}
            />
          )}

          {subformData.length > 0 && (
            <div className="mt-6 min-w-0 space-y-4">
              {subformData.map(
                ({
                  subform,
                  records,
                  fieldLabels: subformFieldLabels,
                  visibleGridFieldKeys,
                  labels,
                  relationOptionsByField,
                  purchaseLineSourceOptionsByType,
                }) => (
                  <EntitySubformGrid
                    key={subform.key}
                    entityKey={entity.key}
                    subform={subform}
                    parentId={record.id}
                    initialRecords={records}
                    fieldLabels={subformFieldLabels}
                    visibleGridFieldKeys={visibleGridFieldKeys}
                    labels={labels}
                    relationOptionsByField={relationOptionsByField}
                    purchaseLineSourceOptionsByType={
                      purchaseLineSourceOptionsByType
                    }
                    activeCompanyPurchaseDefaultLineType={
                      activeCompanyPurchaseDefaultLineType
                    }
                  />
                )
              )}
            </div>
          )}
          {renderPurchaseTotalsSection({
            entity,
            record,
            fieldLabels,
            entityLabels,
          })}
        </div>

        <aside className="min-w-0">
          <div className="sticky top-24 space-y-4">
            {factBoxes.map((factBox) =>
              renderConfiguredFactBox({
                factBox,
                entity,
                record,
                fieldLabels,
                entityLabels,
                documentFactBoxLabels,
              })
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

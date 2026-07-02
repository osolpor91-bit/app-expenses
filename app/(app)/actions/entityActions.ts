"use server";

import { revalidatePath } from "next/cache";

import { requireTenant } from "@/lib/auth/requireTenant";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import type { EntityDefinition } from "@/lib/entities/core/entityDefinition";
import {
  getEntityServiceLabels,
  getEntitySubformServiceLabels,
} from "@/lib/entities/core/entityLabels";
import { getEntityDefinition } from "@/lib/entities/core/entityRegistry";
import {
  mapEntityRecordRelations,
  mapEntityRecordsRelations,
} from "@/lib/entities/core/entityRelations";
import {
  castEntityRecord,
  castEntityRecords,
  listEntityRecords,
  type EntityScopeContext,
  type EntitySearchParams,
  type EntityWritePayload,
  type SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  createStandardEntityRecord,
  deleteStandardEntityRecord,
  deleteStandardEntityRecords,
  updateStandardEntityField,
  updateStandardEntityRecord,
  type EntityValuesInput,
} from "@/lib/entities/core/entityService";
import {
  createStandardEntitySubformRecord,
  deleteStandardEntitySubformRecords,
  updateStandardEntitySubformField,
} from "@/lib/entities/core/entitySubformService";
import { getDictionary } from "@/lib/i18n/server";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";
import {
  getPortalSupplierInvoiceCreateExchangeRatePayload,
  getPortalSupplierInvoiceInvoiceDateUpdateExtraPayload,
} from "@/lib/exchangeRates/portalSupplierInvoiceExchangeRate";
import {
  castEntitySubformRecord,
  getEntitySubformRecordById,
} from "@/lib/entities/core/entitySubformRepository";
import {
  calculatePortalSupplierInvoiceLineAmounts,
  isPortalSupplierInvoiceLineCalculationField,
} from "@/lib/portalSupplierInvoices/portalSupplierInvoiceLineCalculations";
import type { EntitySubformDefinition } from "@/lib/entities/core/entityDefinition";
import {
  hasNonZeroInventory,
  normalizeUnitOfMeasure,
  readItemBaseUnitInventory,
} from "@/lib/items/inventory";

type EntityActionContext = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  activeCompanyCurrencyCode?: string | null;
};

type RefreshEntityGridInput = {
  entityKey: string;
  filters?: EntitySearchParams;
};

type CreateEntityGridRecordInput = {
  entityKey: string;
  payload: EntityValuesInput;
};

type UpdateEntityGridRecordInput = {
  entityKey: string;
  id: string;
  payload: EntityValuesInput;
};

type DeleteEntityGridRecordsInput = {
  entityKey: string;
  ids: string[];
};

type CreateListDetailRecordInput = {
  entityKey: string;
  values: Record<string, string>;
};

type UpdateListDetailFieldInput = {
  entityKey: string;
  id: string;
  fieldName: string;
  value: string;
};

type DeleteListDetailRecordInput = {
  entityKey: string;
  id: string;
};

type CreateEntitySubformRecordInput = {
  entityKey: string;
  subformKey: string;
  parentId: string;
  values: Record<string, string>;
};

type UpdateEntitySubformFieldInput = {
  entityKey: string;
  subformKey: string;
  parentId: string;
  id: string;
  fieldName: string;
  value: string;
};

type DeleteEntitySubformRecordsInput = {
  entityKey: string;
  subformKey: string;
  parentId: string;
  ids: string[];
};

async function getActionEntity(entityKey: string) {
  const entity = getEntityDefinition(entityKey);

  if (!entity) {
    return entityOperationError(`La entidad ${entityKey} no está registrada.`);
  }

  return entityOperationOk({
    entity,
  });
}

function ensurePageMode(
  entity: EntityDefinition,
  expectedPageMode: EntityDefinition["pageMode"]
) {
  if (entity.pageMode === expectedPageMode) {
    return null;
  }

  if (expectedPageMode === "editable-grid") {
    return `La entidad ${entity.key} no es de tipo lista editable.`;
  }

  return `La entidad ${entity.key} no es de tipo lista + ficha.`;
}

async function getActionContext(
  entity: EntityDefinition
): Promise<EntityOperationResult<EntityActionContext>> {
  if (entity.scope === "company") {
    const { supabase, tenant, activeCompany } = await requireCompanyContext();

    if (!activeCompany) {
      return entityOperationError("Esta entidad requiere una empresa activa.");
    }

    return entityOperationOk({
      supabase,
      context: {
        tenantId: tenant.id,
        companyId: activeCompany.id,
      },
      activeCompanyCurrencyCode: activeCompany.currency_code ?? null,
    });
  }

  const { supabase, tenant } = await requireTenant();

  return entityOperationOk({
    supabase,
    context: {
      tenantId: tenant.id,
    },
  });
}

function revalidateEntity(entity: EntityDefinition, id?: string) {
  revalidatePath(entity.route);
  revalidatePath("/dashboard");

  if (id) {
    revalidatePath(`${entity.route}/${id}`);
  }
}

async function getActionData({
  entityKey,
  expectedPageMode,
}: {
  entityKey: string;
  expectedPageMode: EntityDefinition["pageMode"];
}) {
  const entityResult = await getActionEntity(entityKey);

  if (!entityResult.ok) {
    return entityResult;
  }

  const { entity } = entityResult.data;
  const pageModeError = ensurePageMode(entity, expectedPageMode);

  if (pageModeError) {
    return entityOperationError(pageModeError);
  }

  const contextResult = await getActionContext(entity);

  if (!contextResult.ok) {
    return contextResult;
  }

  return entityOperationOk({
    entity,
    supabase: contextResult.data.supabase,
    context: contextResult.data.context,
    activeCompanyCurrencyCode: contextResult.data.activeCompanyCurrencyCode,
  });
}

function getActionSubform(entity: EntityDefinition, subformKey: string) {
  if (entity.pageMode !== "list-detail") {
    return entityOperationError(
      `La entidad ${entity.key} no admite subformularios.`
    );
  }

  const subform =
    entity.subforms?.find(
      (currentSubform) => currentSubform.key === subformKey
    ) ?? null;

  if (!subform) {
    return entityOperationError(
      `El subformulario ${subformKey} no está registrado en ${entity.key}.`
    );
  }

  return entityOperationOk({
    subform,
  });
}

function isPurchaseHeaderEntity(entity: EntityDefinition) {
  return entity.table === "purchases_header";
}

function isPurchaseInvoiceLinesSubform({
  entity,
  subformKey,
}: {
  entity: EntityDefinition;
  subformKey: string;
}) {
  return isPurchaseHeaderEntity(entity) && subformKey === "lines";
}

type PurchaseLineType = "item" | "account";

const purchaseLineDerivedFieldNames = new Set([
  "line_type",
  "line_source_id",
  "fiscal_treatment_id",
]);

function isPurchaseLineType(value: unknown): value is PurchaseLineType {
  return value === "item" || value === "account";
}

function getStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function getMergedLineValue({
  currentRecord,
  values,
  fieldName,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  fieldName: string;
}) {
  if (Object.prototype.hasOwnProperty.call(values, fieldName)) {
    return values[fieldName];
  }

  return currentRecord?.[fieldName] ?? null;
}

function getMergedPurchaseLineType({
  currentRecord,
  values,
}: {
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
}) {
  const value = getMergedLineValue({
    currentRecord,
    values,
    fieldName: "line_type",
  });

  return isPurchaseLineType(value) ? value : "item";
}

async function getPurchaseHeaderLineContext({
  supabase,
  context,
  parentId,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  parentId: string;
}): Promise<
  EntityOperationResult<{
    taxAreaId: string | null;
    sourceType: string | null;
  }>
> {
  let query = supabase
    .from("purchases_header")
    .select("tax_area_id, source_type")
    .eq("id", parentId)
    .eq("tenant_id", context.tenantId);

  if (context.companyId) {
    query = query.eq("company_id", context.companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    return entityOperationError(error.message);
  }

  return entityOperationOk({
    taxAreaId: getStringValue(data?.tax_area_id) || null,
    sourceType: getStringValue(data?.source_type) || null,
  });
}

async function getPurchaseLineSourcePayload({
  supabase,
  context,
  lineType,
  lineSourceId,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  lineType: PurchaseLineType;
  lineSourceId: string;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (!lineSourceId) {
    return entityOperationOk({
      line_source_no: null,
      description: null,
      fiscal_treatment_id: null,
      purchase_price: null,
    });
  }

  if (lineType === "item") {
    let query = supabase
      .from("items")
      .select("id, code, description, fiscal_treatment_id, purchase_price")
      .eq("id", lineSourceId)
      .eq("tenant_id", context.tenantId)
      .eq("is_active", true);

    if (context.companyId) {
      query = query.eq("company_id", context.companyId);
    }

    const { data, error } = await query.single();

    if (error) {
      return entityOperationError(error.message);
    }

    return entityOperationOk({
      line_source_no: getStringValue(data?.code) || null,
      description: getStringValue(data?.description) || null,
      fiscal_treatment_id: getStringValue(data?.fiscal_treatment_id) || null,
      purchase_price: Number(data?.purchase_price ?? 0),
    });
  }

  let query = supabase
    .from("chart_of_accounts")
    .select("id, code, description, fiscal_treatment_id")
    .eq("id", lineSourceId)
    .eq("tenant_id", context.tenantId)
    .eq("is_heading", false);

  if (context.companyId) {
    query = query.eq("company_id", context.companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    return entityOperationError(error.message);
  }

  return entityOperationOk({
    line_source_no: getStringValue(data?.code) || null,
    description: getStringValue(data?.description) || null,
    fiscal_treatment_id: getStringValue(data?.fiscal_treatment_id) || null,
    purchase_price: null,
  });
}

function getPurchaseLinePurchasePricePayload({
  lineType,
  purchasePrice,
  values,
  purchaseHeaderSourceType,
}: {
  lineType: PurchaseLineType;
  purchasePrice: unknown;
  values: Record<string, unknown>;
  purchaseHeaderSourceType: string | null;
}): EntityWritePayload {
  if (purchaseHeaderSourceType === "portal" || lineType !== "item") {
    return {};
  }

  if (
    Object.prototype.hasOwnProperty.call(values, "unit_price") &&
    getStringValue(values.unit_price)
  ) {
    return {};
  }

  const numericPurchasePrice = Number(purchasePrice ?? 0);

  if (!Number.isFinite(numericPurchasePrice)) {
    return {};
  }

  return {
    unit_price: numericPurchasePrice,
  };
}

async function getPurchaseLineTaxConfigurationPayload({
  supabase,
  context,
  taxAreaId,
  fiscalTreatmentId,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  taxAreaId: string | null;
  fiscalTreatmentId: string | null;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (!fiscalTreatmentId) {
    return entityOperationOk({
      vat_rate: 0,
      equivalence_surcharge_rate: 0,
    });
  }

  if (!taxAreaId) {
    return entityOperationOk({});
  }

  let query = supabase
    .from("tax_configurations")
    .select("vat_rate, equivalence_surcharge_rate")
    .eq("tenant_id", context.tenantId)
    .eq("tax_area_id", taxAreaId)
    .eq("fiscal_treatment_id", fiscalTreatmentId);

  if (context.companyId) {
    query = query.eq("company_id", context.companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data) {
    return entityOperationError(
      "No se ha encontrado configuración de impuestos para el área y tratamiento fiscal seleccionados."
    );
  }

  return entityOperationOk({
    vat_rate: Number(data.vat_rate ?? 0),
    equivalence_surcharge_rate: Number(
      data.equivalence_surcharge_rate ?? 0
    ),
  });
}

async function getPurchaseLineDerivedPayload({
  supabase,
  context,
  parentId,
  currentRecord = null,
  values,
  changedFieldName,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  parentId: string;
  currentRecord?: Record<string, unknown> | null;
  values: Record<string, unknown>;
  changedFieldName: string | null;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (changedFieldName === "line_type") {
    return entityOperationOk({
      line_source_id: null,
      line_source_no: null,
      description: null,
      fiscal_treatment_id: null,
      vat_rate: 0,
      equivalence_surcharge_rate: 0,
    });
  }

  const lineType = getMergedPurchaseLineType({
    currentRecord,
    values,
  });

  let payload: EntityWritePayload = {};
  let shouldApplyPurchasePrice = false;
  const headerContextResult = await getPurchaseHeaderLineContext({
    supabase,
    context,
    parentId,
  });

  if (!headerContextResult.ok) {
    return headerContextResult;
  }

  if (
    Object.prototype.hasOwnProperty.call(values, "line_source_id") &&
    getStringValue(values.line_source_id)
  ) {
    const sourcePayloadResult = await getPurchaseLineSourcePayload({
      supabase,
      context,
      lineType,
      lineSourceId: getStringValue(values.line_source_id),
    });

    if (!sourcePayloadResult.ok) {
      return sourcePayloadResult;
    }

    payload = {
      ...payload,
      ...sourcePayloadResult.data,
    };
    shouldApplyPurchasePrice = true;
  }

  const fiscalTreatmentId =
    getStringValue(payload.fiscal_treatment_id) ||
    getStringValue(
      getMergedLineValue({
        currentRecord,
        values,
        fieldName: "fiscal_treatment_id",
      })
    ) ||
    null;

  const taxPayloadResult = await getPurchaseLineTaxConfigurationPayload({
    supabase,
    context,
    taxAreaId: headerContextResult.data.taxAreaId,
    fiscalTreatmentId,
  });

  if (!taxPayloadResult.ok) {
    return taxPayloadResult;
  }

  const purchasePricePayload = shouldApplyPurchasePrice
    ? getPurchaseLinePurchasePricePayload({
        lineType,
        purchasePrice: payload.purchase_price,
        values,
        purchaseHeaderSourceType: headerContextResult.data.sourceType,
      })
    : {};

  delete payload.purchase_price;

  return entityOperationOk({
    ...payload,
    ...taxPayloadResult.data,
    ...purchasePricePayload,
  });
}

function shouldDerivePurchaseLinePayload(fieldName: string | null) {
  if (!fieldName) {
    return true;
  }

  return purchaseLineDerivedFieldNames.has(fieldName);
}

async function getCreateSubformExtraPayload({
  entity,
  subform,
  context,
  supabase,
  parentId,
  values,
}: {
  entity: EntityDefinition;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  supabase: SupabaseServerClient;
  parentId: string;
  values: Record<string, string>;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (
    !isPurchaseInvoiceLinesSubform({
      entity,
      subformKey: subform.key,
    })
  ) {
    return entityOperationOk({});
  }

  const derivedPayloadResult = await getPurchaseLineDerivedPayload({
    supabase,
    context,
    parentId,
    values,
    changedFieldName: null,
  });

  if (!derivedPayloadResult.ok) {
    return derivedPayloadResult;
  }

  const calculationResult = calculatePortalSupplierInvoiceLineAmounts({
    values: {
      ...values,
      ...derivedPayloadResult.data,
    },
    changedFieldName: null,
  });

  if (!calculationResult.ok) {
    return entityOperationError(calculationResult.error);
  }

  return entityOperationOk({
    ...derivedPayloadResult.data,
    ...calculationResult.payload,
  });
}

async function getUpdateSubformExtraPayload({
  entity,
  subform,
  context,
  supabase,
  parentId,
  id,
  fieldName,
  value,
}: {
  entity: EntityDefinition;
  subform: EntitySubformDefinition;
  context: EntityScopeContext;
  supabase: SupabaseServerClient;
  parentId: string;
  id: string;
  fieldName: string;
  value: string;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (
    !isPurchaseInvoiceLinesSubform({
      entity,
      subformKey: subform.key,
    })
  ) {
    return entityOperationOk({});
  }

  const mustDerivePayload = shouldDerivePurchaseLinePayload(fieldName);
  const mustCalculatePayload = isPortalSupplierInvoiceLineCalculationField(fieldName);

  if (!mustDerivePayload && !mustCalculatePayload) {
    return entityOperationOk({});
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

  const values = {
    [fieldName]: value,
  };

  const derivedPayloadResult = mustDerivePayload
    ? await getPurchaseLineDerivedPayload({
      supabase,
      context,
      parentId,
      currentRecord,
      values,
      changedFieldName: fieldName,
    })
    : entityOperationOk({});

  if (!derivedPayloadResult.ok) {
    return derivedPayloadResult;
  }

  const calculationResult = calculatePortalSupplierInvoiceLineAmounts({
    currentRecord,
    values: {
      ...values,
      ...derivedPayloadResult.data,
    },
    changedFieldName: fieldName,
  });

  if (!calculationResult.ok) {
    return entityOperationError(calculationResult.error);
  }

  return entityOperationOk({
    ...derivedPayloadResult.data,
    ...calculationResult.payload,
  });
}

function getPurchaseHeaderSourceType(entity: EntityDefinition) {
  if (entity.key === "portalSupplierInvoices") {
    return "portal";
  }

  if (entity.key === "purchaseInvoices") {
    return "manual";
  }

  return null;
}

async function getCreateListDetailExtraPayload({
  entity,
  supabase,
  context,
  activeCompanyCurrencyCode,
  values,
}: {
  entity: EntityDefinition;
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  activeCompanyCurrencyCode?: string | null;
  values: Record<string, string>;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (!isPurchaseHeaderEntity(entity)) {
    return entityOperationOk({});
  }

  const exchangeRatePayloadResult =
    await getPortalSupplierInvoiceCreateExchangeRatePayload({
      supabase,
      context,
      activeCompanyCurrencyCode,
      values,
    });

  if (!exchangeRatePayloadResult.ok) {
    return exchangeRatePayloadResult;
  }

  const sourceType = getPurchaseHeaderSourceType(entity);

  return entityOperationOk({
    ...exchangeRatePayloadResult.data,
    ...(sourceType ? { source_type: sourceType } : {}),
  });
}

async function getUpdateListDetailFieldExtraPayload({
  entity,
  supabase,
  context,
  activeCompanyCurrencyCode,
  id,
  fieldName,
  value,
}: {
  entity: EntityDefinition;
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  activeCompanyCurrencyCode?: string | null;
  id: string;
  fieldName: string;
  value: string;
}): Promise<EntityOperationResult<EntityWritePayload>> {
  if (!isPurchaseHeaderEntity(entity)) {
    return entityOperationOk({});
  }

  return getPortalSupplierInvoiceInvoiceDateUpdateExtraPayload({
    supabase,
    context,
    id,
    fieldName,
    value,
    activeCompanyCurrencyCode,
  });
}

async function validateItemBaseUnitOfMeasureUpdate({
  entity,
  supabase,
  context,
  id,
  fieldName,
  value,
}: {
  entity: EntityDefinition;
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  id: string;
  fieldName: string;
  value: string;
}): Promise<EntityOperationResult<null>> {
  if (entity.key !== "items" || fieldName !== "base_unit_of_measure") {
    return entityOperationOk(null);
  }

  const nextUnitOfMeasure = normalizeUnitOfMeasure(value);

  let query = supabase
    .from("items")
    .select("id, base_unit_of_measure")
    .eq("id", id)
    .eq("tenant_id", context.tenantId);

  if (context.companyId) {
    query = query.eq("company_id", context.companyId);
  }

  const { data: item, error } = await query.single();

  if (error) {
    return entityOperationError(error.message);
  }

  const currentUnitOfMeasure = normalizeUnitOfMeasure(
    item?.base_unit_of_measure
  );

  if (currentUnitOfMeasure === nextUnitOfMeasure) {
    return entityOperationOk(null);
  }

  try {
    const inventory = await readItemBaseUnitInventory({
      supabase,
      context,
      itemId: id,
      baseUnitOfMeasure: currentUnitOfMeasure,
    });

    if (!hasNonZeroInventory(inventory)) {
      return entityOperationOk(null);
    }
  } catch (inventoryError) {
    return entityOperationError(
      inventoryError instanceof Error
        ? inventoryError.message
        : "No se ha podido comprobar el inventario del artículo."
    );
  }

  return entityOperationError(
    "No se puede cambiar la unidad de medida base porque el artículo tiene inventario distinto de cero."
  );
}
/**
 * Editable grid actions.
 */

export async function refreshEntityGridAction({
  entityKey,
  filters = {},
}: RefreshEntityGridInput): Promise<
  EntityOperationResult<{
    records: Array<Record<string, unknown>>;
  }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "editable-grid",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;

  const { data, error } = await listEntityRecords({
    supabase,
    entity,
    context,
    searchParams: filters,
  });

  if (error) {
    return entityOperationError(error.message);
  }

  return entityOperationOk({
    records: mapEntityRecordsRelations(entity, castEntityRecords(data)),
  });
}

export async function createEntityGridRecordAction({
  entityKey,
  payload,
}: CreateEntityGridRecordInput): Promise<
  EntityOperationResult<{
    record: Record<string, unknown>;
  }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "editable-grid",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const { dict } = await getDictionary();

  const result = await createStandardEntityRecord({
    supabase,
    entity,
    context,
    values: payload,
    labels: getEntityServiceLabels(entity, dict),
  });

  if (!result.ok) {
    return result;
  }

  revalidateEntity(entity);

  const record = castEntityRecord(result.data.record);

  if (!record) {
    return entityOperationError("No se ha podido leer el registro actualizado.");
  }

  return entityOperationOk({
    record: mapEntityRecordRelations(entity, record),
  });
}

export async function updateEntityGridRecordAction({
  entityKey,
  id,
  payload,
}: UpdateEntityGridRecordInput): Promise<
  EntityOperationResult<{
    record: Record<string, unknown>;
  }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "editable-grid",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const { dict } = await getDictionary();

  const result = await updateStandardEntityRecord({
    supabase,
    entity,
    context,
    id,
    values: payload,
    labels: getEntityServiceLabels(entity, dict),
  });

  if (!result.ok) {
    return result;
  }

  revalidateEntity(entity);

  const record = castEntityRecord(result.data.record);

  if (!record) {
    return entityOperationError("No se ha podido leer el registro actualizado.");
  }

  return entityOperationOk({
    record: mapEntityRecordRelations(entity, record),
  });
}

export async function deleteEntityGridRecordsAction({
  entityKey,
  ids,
}: DeleteEntityGridRecordsInput): Promise<
  EntityOperationResult<{
    ids: string[];
  }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "editable-grid",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const { dict } = await getDictionary();

  const result = await deleteStandardEntityRecords({
    supabase,
    entity,
    context,
    ids,
    labels: getEntityServiceLabels(entity, dict),
  });

  if (result.ok) {
    revalidateEntity(entity);
  }

  return result;
}

/**
 * List + detail actions.
 */

export async function createListDetailRecordAction({
  entityKey,
  values,
}: CreateListDetailRecordInput): Promise<EntityOperationResult<{ id: string }>> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context, activeCompanyCurrencyCode } =
    actionDataResult.data;
  const { dict } = await getDictionary();

  const extraPayloadResult = await getCreateListDetailExtraPayload({
    entity,
    supabase,
    context,
    activeCompanyCurrencyCode,
    values,
  });

  if (!extraPayloadResult.ok) {
    return extraPayloadResult;
  }

  const result = await createStandardEntityRecord({
    supabase,
    entity,
    context,
    values: values as EntityValuesInput,
    labels: getEntityServiceLabels(entity, dict),
    extraPayload: extraPayloadResult.data,
  });

  if (!result.ok) {
    return result;
  }

  const id = String(result.data.record.id ?? "");

  if (!id) {
    return entityOperationError("No se ha podido crear el registro.");
  }

  revalidateEntity(entity, id);

  return entityOperationOk({
    id,
  });
}

export async function updateListDetailFieldAction({
  entityKey,
  id,
  fieldName,
  value,
}: UpdateListDetailFieldInput): Promise<
  EntityOperationResult<{ value: string | null }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context, activeCompanyCurrencyCode } =
    actionDataResult.data;
  const { dict } = await getDictionary();

  const itemBaseUnitValidationResult = await validateItemBaseUnitOfMeasureUpdate({
    entity,
    supabase,
    context,
    id,
    fieldName,
    value,
  });

  if (!itemBaseUnitValidationResult.ok) {
    return itemBaseUnitValidationResult;
  }

  const extraPayloadResult = await getUpdateListDetailFieldExtraPayload({
    entity,
    supabase,
    context,
    activeCompanyCurrencyCode,
    id,
    fieldName,
    value,
  });

  if (!extraPayloadResult.ok) {
    return extraPayloadResult;
  }

  const result = await updateStandardEntityField({
    supabase,
    entity,
    context,
    id,
    fieldName,
    value,
    labels: getEntityServiceLabels(entity, dict),
    extraPayload: extraPayloadResult.data,
  });

  if (result.ok) {
    revalidateEntity(entity, id);
  }

  return result;
}

export async function deleteListDetailRecordAction({
  entityKey,
  id,
}: DeleteListDetailRecordInput): Promise<EntityOperationResult<{ id: string }>> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const { dict } = await getDictionary();

  const result = await deleteStandardEntityRecord({
    supabase,
    entity,
    context,
    id,
    labels: getEntityServiceLabels(entity, dict),
  });

  if (result.ok) {
    revalidateEntity(entity);
  }

  return result;
}

/**
 * Subform actions.
 */

export async function createEntitySubformRecordAction({
  entityKey,
  subformKey,
  parentId,
  values,
}: CreateEntitySubformRecordInput): Promise<
  EntityOperationResult<{ record: Record<string, unknown> }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const subformResult = getActionSubform(entity, subformKey);

  if (!subformResult.ok) {
    return subformResult;
  }

  const { subform } = subformResult.data;
  const { dict } = await getDictionary();
  const extraPayloadResult = await getCreateSubformExtraPayload({
    entity,
    subform,
    context,
    supabase,
    parentId,
    values,
  });

  if (!extraPayloadResult.ok) {
    return extraPayloadResult;
  }

  const result = await createStandardEntitySubformRecord({
    supabase,
    subform,
    context,
    parentId,
    values,
    labels: getEntitySubformServiceLabels(subform, dict),
    extraPayload: extraPayloadResult.data,
  });

  if (!result.ok) {
    return result;
  }

  revalidateEntity(entity, parentId);

  return entityOperationOk({
    record: result.data.record,
  });
}

export async function updateEntitySubformFieldAction({
  entityKey,
  subformKey,
  parentId,
  id,
  fieldName,
  value,
}: UpdateEntitySubformFieldInput): Promise<
  EntityOperationResult<{ value: string | null; record: Record<string, unknown> }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const subformResult = getActionSubform(entity, subformKey);

  if (!subformResult.ok) {
    return subformResult;
  }

  const { subform } = subformResult.data;
  const { dict } = await getDictionary();

  const extraPayloadResult = await getUpdateSubformExtraPayload({
    entity,
    subform,
    context,
    supabase,
    parentId,
    id,
    fieldName,
    value,
  });

  if (!extraPayloadResult.ok) {
    return extraPayloadResult;
  }

  const result = await updateStandardEntitySubformField({
    supabase,
    subform,
    context,
    parentId,
    id,
    fieldName,
    value,
    labels: getEntitySubformServiceLabels(subform, dict),
    extraPayload: extraPayloadResult.data,
  });

  if (result.ok) {
    revalidateEntity(entity, parentId);
  }

  return result;
}

export async function deleteEntitySubformRecordsAction({
  entityKey,
  subformKey,
  parentId,
  ids,
}: DeleteEntitySubformRecordsInput): Promise<
  EntityOperationResult<{ ids: string[] }>
> {
  const actionDataResult = await getActionData({
    entityKey,
    expectedPageMode: "list-detail",
  });

  if (!actionDataResult.ok) {
    return actionDataResult;
  }

  const { entity, supabase, context } = actionDataResult.data;
  const subformResult = getActionSubform(entity, subformKey);

  if (!subformResult.ok) {
    return subformResult;
  }

  const { subform } = subformResult.data;
  const { dict } = await getDictionary();

  const result = await deleteStandardEntitySubformRecords({
    supabase,
    subform,
    context,
    parentId,
    ids,
    labels: getEntitySubformServiceLabels(subform, dict),
  });

  if (result.ok) {
    revalidateEntity(entity, parentId);
  }

  return result;
}

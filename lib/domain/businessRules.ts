import type {
  EntityRecord,
} from "@/lib/entities/core/entityDefinition";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import type {
  EntityFieldBusinessRuleDefinition,
  EntityFieldBusinessRuleParamValue,
  EntityFieldBusinessRuleTiming,
  EntityFieldDefinition,
} from "@/lib/entityFields/types";
import type { EntityServiceLabels } from "@/lib/services/entityFieldService";

export type BusinessRuleResult =
  | {
    valid: true;
  }
  | {
    valid: false;
    message: string;
  };

type EntityFieldBusinessRuleOwner = {
  key: string;
  table: string;
};

type PreventEditWhenSourceTypeIsPortalConfig = {
  /**
   * Campo que contiene el origen en el propio registro.
   * Por defecto: source_type.
   */
  sourceTypeDbName?: string;

  /**
   * Valor que bloquea la edición.
   * Por defecto: portal.
   */
  sourceTypeValue?: string;

  /**
   * Tabla de cabecera que debe consultarse cuando la regla se usa desde una línea.
   * Ejemplo: purchases_header.
   */
  parentTable?: string;

  /**
   * Campo de la línea que apunta a la cabecera.
   * Ejemplo: purchase_header_id.
   */
  parentIdDbName?: string;

  /**
   * Campo de origen en la cabecera.
   * Por defecto: source_type.
   */
  parentSourceTypeDbName?: string;
  /**
 * Si es true, la regla se ejecuta también al crear.
 * Por defecto solo se ejecuta antes de modificar.
 */
  applyOnCreate?: boolean;
  /**
 * Si es true, la regla se ejecuta también antes de eliminar.
 */
  applyOnDelete?: boolean;
};

type EntityFieldBusinessRuleContext = {
  entity: EntityFieldBusinessRuleOwner;
  field: EntityFieldDefinition;
  currentRecord: EntityRecord;
  newValue: unknown;
  labels: EntityServiceLabels;
  timing: EntityFieldBusinessRuleTiming;
  supabase?: SupabaseServerClient;
  context?: EntityScopeContext;
  businessRule?: EntityFieldBusinessRuleDefinition;
};

type EntityFieldBusinessRuleHandler = (
  context: EntityFieldBusinessRuleContext
) => BusinessRuleResult | Promise<BusinessRuleResult>;

const PREVENT_EDIT_WHEN_SOURCE_TYPE_IS_PORTAL =
  "preventEditWhenSourceTypeIsPortal";

export function businessRuleValid(): BusinessRuleResult {
  return {
    valid: true,
  };
}

export function businessRuleInvalid(message: string): BusinessRuleResult {
  return {
    valid: false,
    message,
  };
}

/**
 * Regla reutilizable tipo Validate de Business Central.
 *
 * Uso en cabecera:
 * businessRules: [preventEditWhenSourceTypeIsPortal()]
 *
 * Uso en línea:
 * businessRules: [
 *   preventEditWhenSourceTypeIsPortal({
 *     parentTable: "purchases_header",
 *     parentIdDbName: "purchase_header_id",
 *   }),
 * ]
 */
export function preventEditWhenSourceTypeIsPortal(
  config: PreventEditWhenSourceTypeIsPortalConfig = {}
): EntityFieldBusinessRuleDefinition {
  const params: Record<string, EntityFieldBusinessRuleParamValue> = {};

  if (config.sourceTypeDbName) {
    params.sourceTypeDbName = config.sourceTypeDbName;
  }

  if (config.sourceTypeValue) {
    params.sourceTypeValue = config.sourceTypeValue;
  }

  if (config.parentTable) {
    params.parentTable = config.parentTable;
  }

  if (config.parentIdDbName) {
    params.parentIdDbName = config.parentIdDbName;
  }

  if (config.parentSourceTypeDbName) {
    params.parentSourceTypeDbName = config.parentSourceTypeDbName;
  }

  const timings: EntityFieldBusinessRuleTiming[] = ["beforeUpdate"];

  if (config.applyOnCreate) {
    timings.unshift("beforeCreate");
  }

  if (config.applyOnDelete) {
    timings.push("beforeDelete");
  }

  return {
    key: PREVENT_EDIT_WHEN_SOURCE_TYPE_IS_PORTAL,
    timings,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  };
}

function getParamAsString({
  params,
  key,
}: {
  params: Record<string, EntityFieldBusinessRuleParamValue> | undefined;
  key: string;
}) {
  const value = params?.[key];

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function normalizeComparableValue(value: unknown, field?: EntityFieldDefinition) {
  if (value === null || value === undefined) {
    return "";
  }

  if (field?.type === "decimal") {
    const textValue = String(value).trim();

    if (!textValue) {
      return "";
    }

    const normalizedTextValue = textValue.includes(",")
      ? textValue.replace(/\./g, "").replace(",", ".")
      : textValue;

    const numericValue = Number(normalizedTextValue);

    if (Number.isFinite(numericValue)) {
      return String(numericValue);
    }
  }

  return String(value).trim();
}

function getFieldLabel({
  field,
  labels,
}: {
  field: EntityFieldDefinition;
  labels: EntityServiceLabels;
}) {
  return labels.fieldLabelsByDbName[field.dbName] ?? field.labelKey;
}

function formatMessage(
  message: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce((formattedMessage, [key, value]) => {
    return formattedMessage.split(`{${key}}`).join(value);
  }, message);
}

function hasFieldValueChanged({
  field,
  currentRecord,
  newValue,
}: {
  field: EntityFieldDefinition;
  currentRecord: EntityRecord;
  newValue: unknown;
}) {
  return (
    normalizeComparableValue(currentRecord[field.dbName], field) !==
    normalizeComparableValue(newValue, field)
  );
}

async function getSourceRecordForBusinessRule({
  currentRecord,
  supabase,
  context,
  businessRule,
}: {
  currentRecord: EntityRecord;
  supabase?: SupabaseServerClient;
  context?: EntityScopeContext;
  businessRule?: EntityFieldBusinessRuleDefinition;
}): Promise<BusinessRuleResult & { record?: EntityRecord }> {
  const parentTable = getParamAsString({
    params: businessRule?.params,
    key: "parentTable",
  });

  const parentIdDbName = getParamAsString({
    params: businessRule?.params,
    key: "parentIdDbName",
  });

  if (!parentTable && !parentIdDbName) {
    return {
      valid: true,
      record: currentRecord,
    };
  }

  if (!parentTable || !parentIdDbName) {
    return businessRuleInvalid(
      "La business rule de origen portal no tiene configurada correctamente la cabecera."
    );
  }

  if (!supabase || !context) {
    return businessRuleInvalid(
      "No se ha recibido el contexto necesario para validar la cabecera."
    );
  }

  const parentId = normalizeComparableValue(currentRecord[parentIdDbName]);

  if (!parentId) {
    return businessRuleInvalid(
      "No se ha podido identificar la cabecera de la línea."
    );
  }

  const parentSourceTypeDbName =
    getParamAsString({
      params: businessRule?.params,
      key: "parentSourceTypeDbName",
    }) ?? "source_type";

  let query = (supabase as any)
    .from(parentTable)
    .select(`id, tenant_id, company_id, ${parentSourceTypeDbName}`)
    .eq("id", parentId)
    .eq("tenant_id", context.tenantId);

  if (context.companyId) {
    query = query.eq("company_id", context.companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    return businessRuleInvalid(error.message);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return businessRuleInvalid(
      "No se ha podido leer la cabecera para validar la regla de negocio."
    );
  }

  return {
    valid: true,
    record: data as EntityRecord,
  };
}

async function preventEditWhenSourceTypeIsPortalHandler({
  field,
  currentRecord,
  newValue,
  labels,
  timing,
  supabase,
  context,
  businessRule,
}: EntityFieldBusinessRuleContext): Promise<BusinessRuleResult> {
  const sourceRecordResult = await getSourceRecordForBusinessRule({
    currentRecord,
    supabase,
    context,
    businessRule,
  });

  if (!sourceRecordResult.valid) {
    return sourceRecordResult;
  }

  const sourceRecord = sourceRecordResult.record ?? currentRecord;

  const sourceTypeDbName =
    getParamAsString({
      params: businessRule?.params,
      key: "parentTable",
    }) !== null
      ? getParamAsString({
        params: businessRule?.params,
        key: "parentSourceTypeDbName",
      }) ?? "source_type"
      : getParamAsString({
        params: businessRule?.params,
        key: "sourceTypeDbName",
      }) ?? "source_type";

  const sourceTypeValue =
    getParamAsString({
      params: businessRule?.params,
      key: "sourceTypeValue",
    }) ?? "portal";

  const recordSourceType = normalizeComparableValue(
    sourceRecord[sourceTypeDbName]
  ).toLowerCase();

  if (recordSourceType !== sourceTypeValue.toLowerCase()) {
    return businessRuleValid();
  }

  if (timing === "beforeUpdate") {
    if (
      !hasFieldValueChanged({
        field,
        currentRecord,
        newValue,
      })
    ) {
      return businessRuleValid();
    }
  }

  const message =
    timing === "beforeDelete"
      ? "No se puede eliminar la línea porque el origen del registro es Portal proveedor."
      : formatMessage(
        "No se puede modificar el campo {field} porque el origen del registro es Portal proveedor.",
        {
          field: getFieldLabel({
            field,
            labels,
          }),
        }
      );

  return businessRuleInvalid(message);
}

const entityFieldBusinessRuleHandlers: Record<
  string,
  EntityFieldBusinessRuleHandler
> = {
  [PREVENT_EDIT_WHEN_SOURCE_TYPE_IS_PORTAL]:
    preventEditWhenSourceTypeIsPortalHandler,
};

function businessRuleAppliesToTiming({
  businessRule,
  timing,
}: {
  businessRule: EntityFieldBusinessRuleDefinition;
  timing: EntityFieldBusinessRuleTiming;
}) {
  if (businessRule.timings) {
    return businessRule.timings.includes(timing);
  }

  return (businessRule.timing ?? "beforeUpdate") === timing;
}

function getBusinessRulesForTiming({
  field,
  timing,
}: {
  field: EntityFieldDefinition;
  timing: EntityFieldBusinessRuleTiming;
}) {
  return (
    field.businessRules?.filter((businessRule) =>
      businessRuleAppliesToTiming({
        businessRule,
        timing,
      })
    ) ?? []
  );
}

export function hasFieldBusinessRulesForTiming({
  field,
  timing,
}: {
  field: EntityFieldDefinition;
  timing: EntityFieldBusinessRuleTiming;
}) {
  return getBusinessRulesForTiming({
    field,
    timing,
  }).length > 0;
}

export function hasFieldBeforeUpdateBusinessRules(
  field: EntityFieldDefinition
) {
  return hasFieldBusinessRulesForTiming({
    field,
    timing: "beforeUpdate",
  });
}

export function hasFieldBeforeCreateBusinessRules(
  field: EntityFieldDefinition
) {
  return hasFieldBusinessRulesForTiming({
    field,
    timing: "beforeCreate",
  });
}

export function hasFieldBeforeDeleteBusinessRules(
  field: EntityFieldDefinition
) {
  return hasFieldBusinessRulesForTiming({
    field,
    timing: "beforeDelete",
  });
}

export async function validateFieldBusinessRulesForTiming({
  entity,
  field,
  currentRecord,
  newValue,
  labels,
  timing,
  supabase,
  context,
}: EntityFieldBusinessRuleContext): Promise<BusinessRuleResult> {
  const matchingRules = getBusinessRulesForTiming({
    field,
    timing,
  });

  for (const businessRule of matchingRules) {
    const handler = entityFieldBusinessRuleHandlers[businessRule.key];

    if (!handler) {
      return businessRuleInvalid(
        `La business rule ${businessRule.key} no está configurada en ${entity.key}.${field.dbName}.`
      );
    }

    const result = await handler({
      entity,
      field,
      currentRecord,
      newValue,
      labels,
      timing,
      supabase,
      context,
      businessRule,
    });

    if (!result.valid) {
      return result;
    }
  }

  return businessRuleValid();
}

export async function validateFieldBeforeUpdateBusinessRules({
  entity,
  field,
  currentRecord,
  newValue,
  labels,
  supabase,
  context,
}: Omit<EntityFieldBusinessRuleContext, "timing">): Promise<BusinessRuleResult> {
  return validateFieldBusinessRulesForTiming({
    entity,
    field,
    currentRecord,
    newValue,
    labels,
    timing: "beforeUpdate",
    supabase,
    context,
  });
}

export async function validateFieldBeforeCreateBusinessRules({
  entity,
  field,
  currentRecord,
  newValue,
  labels,
  supabase,
  context,
}: Omit<EntityFieldBusinessRuleContext, "timing">): Promise<BusinessRuleResult> {
  return validateFieldBusinessRulesForTiming({
    entity,
    field,
    currentRecord,
    newValue,
    labels,
    timing: "beforeCreate",
    supabase,
    context,
  });
}
export async function validateFieldBeforeDeleteBusinessRules({
  entity,
  field,
  currentRecord,
  newValue,
  labels,
  supabase,
  context,
}: Omit<EntityFieldBusinessRuleContext, "timing">): Promise<BusinessRuleResult> {
  return validateFieldBusinessRulesForTiming({
    entity,
    field,
    currentRecord,
    newValue,
    labels,
    timing: "beforeDelete",
    supabase,
    context,
  });
}
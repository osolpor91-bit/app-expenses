import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const fiscalTreatmentFields: readonly EntityFieldDefinition[] = [
  {
    key: "code",
    dbName: "code",
    labelKey: "code",
    type: "text",
    normalization: "uppercase",
    required: true,
    showInList: true,
    showInGrid: true,
  },
  {
    key: "description",
    dbName: "description",
    labelKey: "description",
    type: "text",
    required: false,
    showInList: true,
    showInGrid: true,
  },
];

export const fiscalTreatmentSearchColumns = ["code", "description"] as const;

export const fiscalTreatmentFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "code",
    column: "code",
    labelKey: "code",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "description",
    column: "description",
    labelKey: "description",
    type: "text",
    operator: "ilike",
  },
];

export const fiscalTreatmentSelectColumns = getDbColumnsFromFields(
  fiscalTreatmentFields,
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const fiscalTreatmentEntity = {
  key: "fiscalTreatments",
  table: "fiscal_treatments",
  route: "/fiscal-treatments",
  labelsKey: "fiscalTreatments",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "code",
  newRowId: "__new_fiscal_treatment__",

  fields: fiscalTreatmentFields,
  selectColumns: fiscalTreatmentSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: fiscalTreatmentSearchColumns,
  filters: fiscalTreatmentFilters,

  orderBy: {
    column: "code",
    ascending: true,
  },

  grid: {
    heightClass: "h-[calc(100vh-230px)]",
    defaultColumnLayout: {
      flex: 1,
      minWidth: 130,
    },
    columnLayouts: {
      description: {
        flex: 2,
        minWidth: 220,
      },
    },
  },
} satisfies EditableGridEntityDefinition;
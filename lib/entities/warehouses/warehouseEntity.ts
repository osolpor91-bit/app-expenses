import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const warehouseFields: readonly EntityFieldDefinition[] = [
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
  {
    key: "is_default",
    dbName: "is_default",
    labelKey: "isDefault",
    type: "boolean",
    required: false,
    newRowDefaultValue: false,
    showInList: true,
    showInGrid: true,
  },
];

export const warehouseFilters: readonly EntityFilterDefinition[] = [
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
  {
    paramName: "isDefault",
    column: "is_default",
    labelKey: "isDefault",
    type: "boolean",
  },
];

export const warehouseSelectColumns = getDbColumnsFromFields(
  warehouseFields,
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const warehouseEntity = {
  key: "warehouses",
  table: "warehouses",
  route: "/warehouses",
  labelsKey: "warehouses",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "code",
  newRowId: "__new_warehouse__",

  fields: warehouseFields,
  selectColumns: warehouseSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: ["code", "description"],
  filters: warehouseFilters,

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
      code: {
        flex: 1,
        minWidth: 150,
      },
      description: {
        flex: 2,
        minWidth: 240,
      },
      is_default: {
        flex: 1,
        minWidth: 140,
      },
    },
  },
} satisfies EditableGridEntityDefinition;

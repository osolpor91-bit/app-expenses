import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const countryFields: readonly EntityFieldDefinition[] = [
  {
    key: "code",
    dbName: "code",
    labelKey: "code",
    type: "text",
    validation: "countryCode",
    normalization: "uppercase",
    required: true,
    showInList: true,
    showInGrid: true,
  },
  {
    key: "name",
    dbName: "name",
    labelKey: "name",
    type: "text",
    required: false,
    showInList: true,
    showInGrid: true,
  },
  {
    key: "is_eu",
    dbName: "is_eu",
    labelKey: "isEu",
    type: "boolean",
    required: false,
    showInList: true,
    showInGrid: true,
  },
];

export const countrySearchColumns = ["code", "name"] as const;

export const countryFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "code",
    column: "code",
    labelKey: "code",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "name",
    column: "name",
    labelKey: "name",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "isEu",
    column: "is_eu",
    labelKey: "isEu",
    type: "boolean",
  },
];

export const countrySelectColumns = getDbColumnsFromFields(countryFields, [
  "id",
  "tenant_id",
]);

export const countryEntity = {
  key: "countries",
  table: "countries",
  route: "/countries",
  labelsKey: "countries",
  scope: "tenant",
  pageMode: "editable-grid",

  primaryFieldDbName: "code",
  newRowId: "__new_country__",

  fields: countryFields,
  selectColumns: countrySelectColumns,

  searchColumns: countrySearchColumns,
  filters: countryFilters,

  orderBy: {
    column: "code",
    ascending: true,
  },

  grid: {
    heightClass: "h-[calc(100vh-230px)]",
    defaultColumnLayout: {
      flex: 1,
      minWidth: 120,
    },
    columnLayouts: {
      name: {
        flex: 2,
        minWidth: 220,
      },
    },
  },
} satisfies EditableGridEntityDefinition;
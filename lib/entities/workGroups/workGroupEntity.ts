import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const workGroupFields: readonly EntityFieldDefinition[] = [
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
    key: "scheduled_at",
    dbName: "scheduled_at",
    labelKey: "scheduledAt",
    type: "datetime",
    required: false,
    showInList: true,
    showInGrid: true,
  },
];

export const workGroupFilters: readonly EntityFilterDefinition[] = [
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
    paramName: "scheduledAt",
    column: "scheduled_at",
    labelKey: "scheduledAt",
    type: "dateRange",
  },
];

export const workGroupSelectColumns = getDbColumnsFromFields(workGroupFields, [
  "id",
  "tenant_id",
  "company_id",
  "created_at",
  "updated_at",
]);

export const workGroupEntity = {
  key: "workGroups",
  table: "work_groups",
  route: "/work-groups",
  labelsKey: "workGroups",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "code",
  newRowId: "__new_work_group__",

  fields: workGroupFields,
  selectColumns: workGroupSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: ["code", "description"],
  filters: workGroupFilters,

  orderBy: {
    column: "scheduled_at",
    ascending: true,
  },

  grid: {
    heightClass: "h-[calc(100vh-230px)]",
    defaultColumnLayout: {
      flex: 1,
      minWidth: 150,
    },
    columnLayouts: {
      code: {
        flex: 1,
        minWidth: 160,
      },
      description: {
        flex: 2,
        minWidth: 260,
      },
      scheduled_at: {
        flex: 1,
        minWidth: 190,
      },
    },
  },
} satisfies EditableGridEntityDefinition;

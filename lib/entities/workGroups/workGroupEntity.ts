import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
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
    showInForm: true,
  },
  {
    key: "description",
    dbName: "description",
    labelKey: "description",
    type: "text",
    required: false,
    showInList: true,
    showInForm: true,
    formColSpan: "full",
  },
  {
    key: "scheduled_at",
    dbName: "scheduled_at",
    labelKey: "scheduledAt",
    type: "datetime",
    required: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "assigned_count",
    dbName: "assigned_count",
    labelKey: "assignedCount",
    type: "integer",
    required: false,
    editable: false,
    calculated: true,
    showInList: true,
    showInForm: false,
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

export const workGroupSelectColumns = getDbColumnsFromFields(
  workGroupFields.filter((field) => !field.calculated),
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const workGroupEntity = {
  key: "workGroups",
  table: "work_groups",
  route: "/work-groups",
  labelsKey: "workGroups",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "code",
  newRoute: "/work-groups/new",

  fields: workGroupFields,
  selectColumns: workGroupSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: ["code", "description"],
  filters: workGroupFilters,

  orderBy: {
    column: "scheduled_at",
    ascending: true,
  },

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          "code",
          "scheduled_at",
          { field: "description", colSpan: "full" },
        ],
      },
    ],
  },
} satisfies ListDetailEntityDefinition;

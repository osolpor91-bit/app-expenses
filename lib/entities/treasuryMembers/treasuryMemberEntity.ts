import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const treasuryMemberFields: readonly EntityFieldDefinition[] = [
  {
    key: "first_name",
    dbName: "first_name",
    labelKey: "firstName",
    type: "text",
    required: true,
    showInList: true,
    showInGrid: true,
  },
  {
    key: "last_name",
    dbName: "last_name",
    labelKey: "lastName",
    type: "text",
    required: true,
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

export const treasuryMemberFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "firstName",
    column: "first_name",
    labelKey: "firstName",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "lastName",
    column: "last_name",
    labelKey: "lastName",
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

export const treasuryMemberSelectColumns = getDbColumnsFromFields(
  treasuryMemberFields,
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const treasuryMemberEntity = {
  key: "treasuryMembers",
  table: "treasury_members",
  route: "/treasury-members",
  labelsKey: "treasuryMembers",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "first_name",
  newRowId: "__new_treasury_member__",

  fields: treasuryMemberFields,
  selectColumns: treasuryMemberSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: ["first_name", "last_name"],
  filters: treasuryMemberFilters,

  orderBy: {
    column: "first_name",
    ascending: true,
  },

  grid: {
    heightClass: "h-[calc(100vh-230px)]",
    defaultColumnLayout: {
      flex: 1,
      minWidth: 150,
    },
    columnLayouts: {
      first_name: {
        flex: 2,
        minWidth: 220,
      },
      last_name: {
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

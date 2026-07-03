import { treasuryGeneralTypeOptions } from "@/lib/entityFields/commonOptions";
import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const treasuryGeneralMovementFields: readonly EntityFieldDefinition[] = [
  {
    key: "movement_date",
    dbName: "movement_date",
    labelKey: "movementDate",
    type: "date",
    required: true,
    editable: false,
    showInList: true,
    showInForm: false,
  },
  {
    key: "treasury_type",
    dbName: "treasury_type",
    labelKey: "treasuryType",
    type: "option",
    required: true,
    editable: false,
    options: treasuryGeneralTypeOptions,
    showInList: true,
    showInForm: false,
  },
  {
    key: "account_description",
    dbName: "account_description",
    labelKey: "accountDescription",
    type: "text",
    required: true,
    editable: false,
    showInList: true,
    showInForm: false,
  },
  {
    key: "paid_by_member_id",
    dbName: "paid_by_member_id",
    labelKey: "paidBy",
    type: "select",
    required: false,
    editable: false,
    relation: {
      entityKey: "treasuryMembers",
      displayFieldName: "paid_by_member_display",
      relationDataFieldName: "treasury_members",
      optionValueField: "id",
      optionLabelFieldNames: ["first_name", "last_name"],
      labelSeparator: " ",
    },
    showInList: true,
    showInForm: false,
  },
  {
    key: "settled_by_member_id",
    dbName: "settled_by_member_id",
    labelKey: "settledBy",
    type: "select",
    required: false,
    editable: false,
    relation: {
      entityKey: "treasuryMembers",
      displayFieldName: "settled_by_member_display",
      relationDataFieldName: "settled_by_member",
      optionValueField: "id",
      optionLabelFieldNames: ["first_name", "last_name"],
      labelSeparator: " ",
    },
    showInList: true,
    showInForm: false,
  },
  {
    key: "amount",
    dbName: "amount",
    labelKey: "amount",
    type: "decimal",
    required: true,
    editable: false,
    decimalScale: 2,
    showInList: true,
    showInForm: false,
  },
  {
    key: "entry_description",
    dbName: "entry_description",
    labelKey: "comment",
    type: "text",
    required: false,
    editable: false,
    showInList: true,
    showInForm: false,
  },
];

export const treasuryGeneralMovementFilters: readonly EntityFilterDefinition[] =
  [
    {
      paramName: "movementDate",
      column: "movement_date",
      labelKey: "movementDate",
      type: "dateRange",
    },
    {
      paramName: "type",
      column: "treasury_type",
      labelKey: "treasuryType",
      type: "text",
      operator: "eq",
    },
    {
      paramName: "account",
      column: "account_description",
      labelKey: "accountDescription",
      type: "text",
      operator: "ilike",
    },
  ];

export const treasuryGeneralMovementSelectColumns = getDbColumnsFromFields(
  treasuryGeneralMovementFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "account_id",
    "account_no",
    "created_at",
    "updated_at",
    "treasury_members:paid_by_member_id(id, first_name, last_name)",
    "settled_by_member:settled_by_member_id(id, first_name, last_name)",
  ]
);

export const treasuryGeneralMovementEntity = {
  key: "treasuryGeneralMovements",
  table: "treasury_general_movements",
  route: "/treasury-general/movements",
  labelsKey: "treasuryGeneralMovements",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "account_description",
  newRoute: "/treasury-general/movements/new",

  fields: treasuryGeneralMovementFields,
  selectColumns: treasuryGeneralMovementSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: [
    "account_no",
    "account_description",
    "entry_description",
  ],
  filters: treasuryGeneralMovementFilters,

  orderBy: {
    column: "movement_date",
    ascending: false,
  },

  listActions: {
    create: false,
    edit: false,
    delete: true,
  },
} satisfies ListDetailEntityDefinition;

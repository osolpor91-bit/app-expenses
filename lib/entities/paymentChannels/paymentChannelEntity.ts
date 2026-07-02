import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const paymentChannelFields: readonly EntityFieldDefinition[] = [
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
    key: "chart_of_account_id",
    dbName: "chart_of_account_id",
    labelKey: "chartOfAccount",
    type: "text",
    required: false,
    showInList: true,
    showInGrid: true,
    relation: {
      entityKey: "chartOfAccounts",
      displayFieldName: "chart_of_account_display",
      optionLabelFieldNames: ["code", "description"],
      relationDataFieldName: "chart_of_accounts",
      labelSeparator: " - ",
      navigable: true,
      optionFilterParams: {
        isHeading: "false",
      },
    },
  },
];

export const paymentChannelSearchColumns = [
  "code",
  "description",
] as const;

export const paymentChannelFilters: readonly EntityFilterDefinition[] = [
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

export const paymentChannelSelectColumns = getDbColumnsFromFields(
  paymentChannelFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "created_at",
    "updated_at",
    "chart_of_accounts:chart_of_account_id(id, code, description)",
  ]
);

export const paymentChannelEntity = {
  key: "paymentChannels",
  table: "payment_channels",
  route: "/payment-channels",
  labelsKey: "paymentChannels",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "code",
  newRowId: "__new_payment_channel__",

  fields: paymentChannelFields,
  selectColumns: paymentChannelSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: paymentChannelSearchColumns,
  filters: paymentChannelFilters,

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
      chart_of_account_id: {
        flex: 2,
        minWidth: 280,
      },
    },
  },
} satisfies EditableGridEntityDefinition;
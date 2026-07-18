import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const itemBalanceEntryFields: readonly EntityFieldDefinition[] = [
  {
    key: "item_code",
    dbName: "item_code",
    labelKey: "itemCode",
    type: "text",
    required: false,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "item_description",
    dbName: "item_description",
    labelKey: "itemDescription",
    type: "text",
    required: false,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "warehouse_code",
    dbName: "warehouse_code",
    labelKey: "warehouse",
    type: "text",
    required: false,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "created_at",
    dbName: "created_at",
    labelKey: "postingDate",
    type: "date",
    required: false,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "document_no",
    dbName: "document_no",
    labelKey: "documentNo",
    type: "text",
    required: true,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "comment",
    dbName: "comment",
    labelKey: "comment",
    type: "text",
    required: false,
    editable: false,
    showInList: true,
    showInForm: true,
    formColSpan: "full",
  },
  {
    key: "origin",
    dbName: "origin",
    labelKey: "origin",
    type: "option",
    required: true,
    editable: false,
    options: [
      { value: "Compra", labelKey: "originPurchase" },
      { value: "Venta", labelKey: "originSale" },
      { value: "Ajuste", labelKey: "originAdjustment" },
    ],
    showInList: true,
    showInForm: true,
  },
  {
    key: "entry_type",
    dbName: "entry_type",
    labelKey: "entryType",
    type: "option",
    required: true,
    editable: false,
    options: [
      { value: "in", labelKey: "entryTypeIn" },
      { value: "out", labelKey: "entryTypeOut" },
    ],
    showInList: true,
    showInForm: true,
  },
  {
    key: "quantity",
    dbName: "quantity",
    labelKey: "quantity",
    type: "decimal",
    required: true,
    editable: false,
    showInList: true,
    showInForm: true,
  },
  {
    key: "unit_of_measure",
    dbName: "unit_of_measure",
    labelKey: "unitOfMeasure",
    type: "text",
    required: true,
    editable: false,
    showInList: true,
    showInForm: true,
  },
];

export const itemBalanceEntrySearchColumns = [
  "item_code",
  "item_description",
  "warehouse_code",
  "document_no",
  "comment",
] as const;

export const itemBalanceEntryFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "itemId",
    column: "item_id",
    labelKey: "item",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "itemCode",
    column: "item_code",
    labelKey: "itemCode",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "documentNo",
    column: "document_no",
    labelKey: "documentNo",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "origin",
    column: "origin",
    labelKey: "origin",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "entryType",
    column: "entry_type",
    labelKey: "entryType",
    type: "text",
    operator: "eq",
  },
];

export const itemBalanceEntrySelectColumns = getDbColumnsFromFields(
  itemBalanceEntryFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "item_id",
    "warehouse_id",
    "created_at",
    "updated_at",
  ]
);

export const itemBalanceEntryEntity = {
  key: "itemBalanceEntries",
  table: "item_balance_entries",
  route: "/item-balance-entries",
  labelsKey: "itemBalanceEntries",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "item_description",
  newRoute: "/item-balance-entries/new",

  fields: itemBalanceEntryFields,
  selectColumns: itemBalanceEntrySelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: itemBalanceEntrySearchColumns,
  filters: itemBalanceEntryFilters,

  orderBy: {
    column: "created_at",
    ascending: false,
  },

  listActions: {
    create: false,
    edit: false,
    delete: false,
  },
} satisfies ListDetailEntityDefinition;

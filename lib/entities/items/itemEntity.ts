import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const itemFields: readonly EntityFieldDefinition[] = [
  {
    key: "code",
    dbName: "code",
    labelKey: "code",
    type: "text",
    normalization: "uppercase",
    required: true,
    grid: {
      width: "xs",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "description",
    dbName: "description",
    labelKey: "description",
    type: "text",
    required: true,
    grid: {
      width: "md",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "inventory",
    dbName: "inventory",
    labelKey: "inventory",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    grid: {
      width: "xs",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "base_unit_of_measure",
    dbName: "base_unit_of_measure",
    labelKey: "baseUnitOfMeasure",
    type: "option",
    required: true,
    options: [
      { value: "UND", labelKey: "unitUnd" },
      { value: "KG", labelKey: "unitKg" },
      { value: "G", labelKey: "unitG" },
      { value: "L", labelKey: "unitL" },
      { value: "M", labelKey: "unitM" },
      { value: "H", labelKey: "unitH" },
      { value: "CAJA", labelKey: "unitBox" },
      { value: "PAQ", labelKey: "unitPack" },
    ],
    newRowDefaultValue: "UND",
    grid: {
      width: "sm",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "item_type",
    dbName: "item_type",
    labelKey: "itemType",
    type: "option",
    required: true,
    options: [
      { value: "product", labelKey: "itemTypeProduct" },
      { value: "service", labelKey: "itemTypeService" },
      { value: "expense", labelKey: "itemTypeExpense" },
      { value: "other", labelKey: "itemTypeOther" },
    ],
    newRowDefaultValue: "product",
    grid: {
      width: "sm",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "category",
    dbName: "category",
    labelKey: "category",
    type: "text",
    required: false,
    grid: {
      width: "md",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "barcode",
    dbName: "barcode",
    labelKey: "barcode",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
  },
  {
    key: "preferred_supplier_id",
    dbName: "preferred_supplier_id",
    labelKey: "preferredSupplier",
    type: "select",
    required: false,
    relation: {
      entityKey: "suppliers",
      displayFieldName: "preferred_supplier_display",
      relationDataFieldName: "suppliers",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "name"],
      labelSeparator: " - ",
      navigable: true,
    },
    showInList: false,
    showInForm: true,
  },
  {
    key: "purchase_price",
    dbName: "purchase_price",
    labelKey: "purchasePrice",
    type: "decimal",
    required: false,
    showInList: false,
    showInForm: true,
  },
  {
    key: "sales_price",
    dbName: "sales_price",
    labelKey: "salesPrice",
    type: "decimal",
    required: false,
    showInList: false,
    showInForm: true,
  },
  {
    key: "unit_cost",
    dbName: "unit_cost",
    labelKey: "unitCost",
    type: "decimal",
    required: false,
    showInList: false,
    showInForm: true,
  },
  {
    key: "is_active",
    dbName: "is_active",
    labelKey: "isActive",
    type: "boolean",
    required: false,
    newRowDefaultValue: true,
    grid: {
      width: "xs",
    },
    showInList: true,
    showInForm: true,
  },
  {
    key: "fiscal_treatment_id",
    dbName: "fiscal_treatment_id",
    labelKey: "fiscalTreatment",
    type: "select",
    required: false,
    relation: {
      entityKey: "fiscalTreatments",
      displayFieldName: "fiscal_treatment_display",
      relationDataFieldName: "fiscal_treatments",
      optionValueField: "id",
      optionLabelFieldNames: ["code"],
      navigable: true,
    },
    showInList: false,
    showInForm: true,
  },
];

export const itemSearchColumns = [
  "code",
  "description",
  "category",
  "barcode",
] as const;

export const itemFilters: readonly EntityFilterDefinition[] = [
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
    paramName: "category",
    column: "category",
    labelKey: "category",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "isActive",
    column: "is_active",
    labelKey: "isActive",
    type: "boolean",
  },
];

export const itemSelectColumns = getDbColumnsFromFields(itemFields, [
  "id",
  "tenant_id",
  "company_id",
  "created_at",
  "updated_at",
  "suppliers:preferred_supplier_id(id, code, name)",
  "fiscal_treatments:fiscal_treatment_id(id, code, description)",
]);

export const itemEntity = {
  key: "items",
  table: "items",
  route: "/items",
  labelsKey: "items",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "description",
  newRoute: "/items/new",

  fields: itemFields,
  selectColumns: itemSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: itemSearchColumns,
  filters: itemFilters,

  orderBy: {
    column: "code",
    ascending: true,
  },

  listActions: {
    recordActions: [
      {
        key: "balance",
        labelKey: "balanceAction",
        route: "/item-balance-entries",
        recordIdParamName: "itemId",
      },
      {
        key: "inventoryAdjustment",
        labelKey: "inventoryAdjustmentAction",
        route: "/items",
        recordIdParamName: "adjustItemId",
      },
    ],
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
          { field: "description", colSpan: "full" },
          "item_type",
          "category",
          "base_unit_of_measure",
          "barcode",
          "is_active",
          "inventory",
        ],
      },
      {
        key: "purchaseSales",
        labelKey: "sectionPurchaseSales",
        columns: 2,
        fields: [
          "preferred_supplier_id",
          "fiscal_treatment_id",
          "purchase_price",
          "sales_price",
          "unit_cost",
        ],
      },
    ],
  },
} satisfies ListDetailEntityDefinition;

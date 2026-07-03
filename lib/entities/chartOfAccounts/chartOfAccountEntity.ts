import {
  chartOfAccountGroupOptions,
  chartOfAccountLevelOptions,
  chartOfAccountSpecialCategoryOptions,
  chartOfAccountTypeOptions,
  chartOfAccountTypeSourceOptions,
} from "@/lib/entityFields/commonOptions";
import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const chartOfAccountFields: readonly EntityFieldDefinition[] = [
  {
    key: "code",
    dbName: "code",
    labelKey: "code",
    type: "text",
    required: true,
    validation: "digitsOnly",
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "description",
    dbName: "description",
    labelKey: "description",
    type: "text",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "is_heading",
    dbName: "is_heading",
    labelKey: "isHeading",
    type: "boolean",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "account_type",
    dbName: "account_type",
    labelKey: "accountType",
    type: "option",
    required: false,
    showInList: true,
    calculated: true,
    showInForm: true,
    showInFactBox: true,
    options: chartOfAccountTypeOptions,
  },
  {
    key: "account_group",
    dbName: "account_group",
    labelKey: "accountGroup",
    type: "option",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    options: chartOfAccountGroupOptions,
  },
  {
    key: "special_account_category",
    dbName: "special_account_category",
    labelKey: "specialAccountCategory",
    type: "option",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    options: chartOfAccountSpecialCategoryOptions,
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
    showInFactBox: false,
  },
  {
    key: "account_type_source",
    dbName: "account_type_source",
    labelKey: "accountTypeSource",
    type: "option",
    required: false,
    editable: false,
    calculated: true,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    options: chartOfAccountTypeSourceOptions,
  },
  {
    key: "account_level",
    dbName: "account_level",
    labelKey: "accountLevel",
    type: "option",
    required: false,
    editable: false,
    calculated: true,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    options: chartOfAccountLevelOptions,
  },
  {
    key: "code_length",
    dbName: "code_length",
    labelKey: "codeLength",
    type: "integer",
    required: false,
    editable: false,
    calculated: true,
    showInList: false,
    showInForm: false,
    showInFactBox: true,
  },
  {
    key: "sort_code",
    dbName: "sort_code",
    labelKey: "sortCode",
    type: "text",
    required: false,
    editable: false,
    calculated: true,
    showInList: false,
    showInForm: false,
    showInFactBox: true,
  },
];

export const chartOfAccountSearchColumns = [
  "code",
  "description",
] as const;

export const chartOfAccountFilters: readonly EntityFilterDefinition[] = [
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
    paramName: "isHeading",
    column: "is_heading",
    labelKey: "isHeading",
    type: "boolean",
  },
  {
    paramName: "accountType",
    column: "account_type",
    labelKey: "accountType",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "accountGroup",
    column: "account_group",
    labelKey: "accountGroup",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "specialAccountCategory",
    column: "special_account_category",
    labelKey: "specialAccountCategory",
    type: "text",
    operator: "eq",
  },
];

export const chartOfAccountSelectColumns = getDbColumnsFromFields(
  chartOfAccountFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "created_at",
    "updated_at",
    "fiscal_treatments:fiscal_treatment_id(id, code, description)",
  ]
);

export const chartOfAccountEntity = {
  key: "chartOfAccounts",
  table: "chart_of_accounts",
  route: "/chart-of-accounts",
  labelsKey: "chartOfAccounts",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "code",
  newRoute: "/chart-of-accounts/new",

  fields: chartOfAccountFields,
  selectColumns: chartOfAccountSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: chartOfAccountSearchColumns,
  filters: chartOfAccountFilters,

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          "code",
          "is_heading",
          { field: "description", colSpan: "full" },
          "account_type",
          "account_group",
          "special_account_category",
          "account_type_source",
          "account_level",
        ],
      },
      {
        key: "tax",
        labelKey: "sectionTax",
        columns: 3,
        fields: [
          "fiscal_treatment_id",
        ],
      },
    ],
  },

  factBoxes: [],

  orderBy: {
    column: "sort_code",
    ascending: true,
  },
} satisfies ListDetailEntityDefinition;

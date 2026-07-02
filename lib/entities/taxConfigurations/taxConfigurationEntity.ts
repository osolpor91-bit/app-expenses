import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type {
  EntityFieldDefinition,
  EntityFieldOptionDefinition,
} from "@/lib/entityFields/types";
import type { EditableGridEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

const taxConfigurationTaxTypeOptions = [
  {
    value: "normal",
    labelKey: "taxTypeNormal",
  },
  {
    value: "not_subject",
    labelKey: "taxTypeNotSubject",
  },
  {
    value: "reverse_charge",
    labelKey: "taxTypeReverseCharge",
  },
] as const satisfies readonly EntityFieldOptionDefinition[];

export const taxConfigurationFields: readonly EntityFieldDefinition[] = [
  {
    key: "tax_area_id",
    dbName: "tax_area_id",
    labelKey: "taxArea",
    type: "text",
    required: true,
    showInList: true,
    showInGrid: true,
    relation: {
      entityKey: "taxAreas",
      displayFieldName: "tax_area_display",
      relationDataFieldName: "tax_areas",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "description"],
      labelSeparator: " - ",
      navigable: true,
    },
  },
  {
    key: "fiscal_treatment_id",
    dbName: "fiscal_treatment_id",
    labelKey: "fiscalTreatment",
    type: "text",
    required: true,
    showInList: true,
    showInGrid: true,
    relation: {
      entityKey: "fiscalTreatments",
      displayFieldName: "fiscal_treatment_display",
      relationDataFieldName: "fiscal_treatments",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "description"],
      labelSeparator: " - ",
      navigable: true,
    },
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
    key: "tax_type",
    dbName: "tax_type",
    labelKey: "taxType",
    type: "option",
    required: true,
    options: taxConfigurationTaxTypeOptions,
    newRowDefaultValue: "normal",
    showInList: true,
    showInGrid: true,
  },
  {
    key: "vat_rate",
    dbName: "vat_rate",
    labelKey: "vatRate",
    type: "decimal",
    required: false,
    validation: "percentage",
    newRowDefaultValue: "0",
    showInList: true,
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "equivalence_surcharge_rate",
    dbName: "equivalence_surcharge_rate",
    labelKey: "equivalenceSurchargeRate",
    type: "decimal",
    required: false,
    validation: "percentage",
    newRowDefaultValue: "0",
    showInList: true,
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "input_tax_account_id",
    dbName: "input_tax_account_id",
    labelKey: "inputTaxAccount",
    type: "text",
    required: false,
    showInList: true,
    showInGrid: true,
    relation: {
      entityKey: "chartOfAccounts",
      displayFieldName: "input_tax_account_display",
      relationDataFieldName: "input_tax_account",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "description"],
      labelSeparator: " - ",
      navigable: true,
      optionFilterParams: {
        isHeading: "false",
      },
    },
  },
  {
    key: "output_tax_account_id",
    dbName: "output_tax_account_id",
    labelKey: "outputTaxAccount",
    type: "text",
    required: false,
    showInList: true,
    showInGrid: true,
    relation: {
      entityKey: "chartOfAccounts",
      displayFieldName: "output_tax_account_display",
      relationDataFieldName: "output_tax_account",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "description"],
      labelSeparator: " - ",
      navigable: true,
      optionFilterParams: {
        isHeading: "false",
      },
    },
  },
];

export const taxConfigurationSearchColumns = [
  "description",
  "tax_type",
] as const;

export const taxConfigurationFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "description",
    column: "description",
    labelKey: "description",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "taxType",
    column: "tax_type",
    labelKey: "taxType",
    type: "text",
    operator: "eq",
  },
];

export const taxConfigurationSelectColumns = getDbColumnsFromFields(
  taxConfigurationFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "created_at",
    "updated_at",
    "tax_areas:tax_area_id(id, code, description)",
    "fiscal_treatments:fiscal_treatment_id(id, code, description)",
    "input_tax_account:input_tax_account_id(id, code, description, is_heading)",
    "output_tax_account:output_tax_account_id(id, code, description, is_heading)",
  ]
);

export const taxConfigurationEntity = {
  key: "taxConfigurations",
  table: "tax_configurations",
  route: "/tax-configurations",
  labelsKey: "taxConfigurations",
  scope: "company",
  pageMode: "editable-grid",

  primaryFieldDbName: "description",
  newRowId: "__new_tax_configuration__",

  fields: taxConfigurationFields,
  selectColumns: taxConfigurationSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: taxConfigurationSearchColumns,
  filters: taxConfigurationFilters,

  orderBy: {
    column: "description",
    ascending: true,
  },

  grid: {
    heightClass: "h-[calc(100vh-230px)]",
    sortBy: [
      {
        fieldName: "tax_area_display",
      },
      {
        fieldName: "fiscal_treatment_display",
      },
      {
        fieldName: "description",
      },
    ],
    defaultColumnLayout: {
      flex: 1,
      minWidth: 140,
    },
    columnLayouts: {
      tax_area_id: {
        flex: 2,
        minWidth: 260,
      },
      fiscal_treatment_id: {
        flex: 2,
        minWidth: 260,
      },
      description: {
        flex: 2,
        minWidth: 240,
      },
      tax_type: {
        flex: 1,
        minWidth: 160,
      },
      input_tax_account_id: {
        flex: 2,
        minWidth: 280,
      },
      output_tax_account_id: {
        flex: 2,
        minWidth: 280,
      },
    },
  },
} satisfies EditableGridEntityDefinition;
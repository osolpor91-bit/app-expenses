import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

import {
  currencyOptions,
  purchaseLineTypeOptions,
} from "@/lib/entityFields/commonOptions";

export const companyFields: readonly EntityFieldDefinition[] = [
  {
    key: "name",
    dbName: "name",
    labelKey: "name",
    type: "text",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "tax_id",
    dbName: "tax_id",
    labelKey: "taxId",
    type: "text",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "web_url",
    dbName: "web_url",
    labelKey: "websiteUrl",
    type: "text",
    validation: "containsDot",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "phone",
    dbName: "phone",
    labelKey: "phone",
    type: "tel",
    validation: "digitsOnly",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "address",
    dbName: "address",
    labelKey: "address",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "city",
    dbName: "city",
    labelKey: "city",
    type: "text",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "province",
    dbName: "province",
    labelKey: "province",
    type: "text",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "postal_code",
    dbName: "postal_code",
    labelKey: "postalCode",
    type: "text",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "country_id",
    dbName: "country_id",
    labelKey: "country",
    type: "select",
    required: true,
    relation: {
      entityKey: "countries",
      displayFieldName: "country_name",
      relationDataFieldName: "countries",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "name"],
      labelSeparator: " - ",
    },
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "currency_code",
    dbName: "currency_code",
    labelKey: "currency",
    type: "option",
    required: true,
    newRowDefaultValue: "EUR",
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    options: currencyOptions,
  },
  {
    key: "purchase_default_line_type",
    dbName: "purchase_default_line_type",
    labelKey: "purchaseDefaultLineType",
    type: "option",
    required: true,
    options: purchaseLineTypeOptions,
    newRowDefaultValue: "item",
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "attachment_storage_provider",
    dbName: "attachment_storage_provider",
    labelKey: "attachmentStorageProvider",
    type: "option",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    options: [
      {
        value: "supabase_storage",
        labelKey: "storageProviderSupabaseStorage",
      },
      {
        value: "sharepoint",
        labelKey: "storageProviderSharePoint",
      },
    ],
  },
  {
    key: "supplier_portal_enabled",
    dbName: "supplier_portal_enabled",
    labelKey: "supplierPortalEnabled",
    type: "boolean",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "supplier_upload_code",
    dbName: "supplier_upload_code",
    labelKey: "supplierUploadCode",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "supplier_portal_language",
    dbName: "supplier_portal_language",
    labelKey: "supplierPortalLanguage",
    type: "option",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    options: [
      {
        value: "es",
        labelKey: "supplierPortalLanguageEs",
      },
      {
        value: "en",
        labelKey: "supplierPortalLanguageEn",
      },
    ],
  },
];

export const companySearchColumns = [
  "name",
  "tax_id",
  "web_url",
  "phone",
  "address",
  "city",
  "province",
  "postal_code",
] as const;

export const companyFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "name",
    column: "name",
    labelKey: "name",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "taxId",
    column: "tax_id",
    labelKey: "taxId",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "websiteUrl",
    column: "web_url",
    labelKey: "websiteUrl",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "city",
    column: "city",
    labelKey: "city",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "province",
    column: "province",
    labelKey: "province",
    type: "text",
    operator: "ilike",
  },
];

export const companySelectColumns = [
  getDbColumnsFromFields(companyFields, ["id", "tenant_id"]),
  "countries(code, name)",
].join(", ");

export const companyEntity = {
  key: "companies",
  table: "companies",
  route: "/companies",
  labelsKey: "companies",
  scope: "tenant",
  pageMode: "list-detail",

  primaryFieldDbName: "name",
  newRoute: "/companies/new",

  fields: companyFields,
  selectColumns: companySelectColumns,

  searchColumns: companySearchColumns,
  filters: companyFilters,

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          { field: "name", colSpan: "full" },
          "tax_id",
          "currency_code",
          "phone",
          "web_url",
        ],
      },
      {
        key: "address",
        labelKey: "sectionAddress",
        columns: 2,
        fields: [
          { field: "address", colSpan: "full" },
          "city",
          "province",
          "postal_code",
          "country_id",
        ],
      },
      {
        key: "documentSettings",
        labelKey: "sectionDocumentSettings",
        columns: 2,
        fields: ["attachment_storage_provider"],
      },
      {
        key: "purchases",
        labelKey: "sectionPurchases",
        columns: 2,
        fields: ["purchase_default_line_type"],
      },
      {
        key: "supplierPortal",
        labelKey: "sectionSupplierPortal",
        columns: 2,
        fields: [
          "supplier_portal_enabled",
          "supplier_portal_language",
          { field: "supplier_upload_code", colSpan: "full" },
        ],
      },
    ],
  },

  factBoxes: [
    {
      key: "summary",
      type: "recordSummary",
      titleLabelKey: "factBoxTitle",
    },
  ],

  orderBy: {
    column: "name",
    ascending: true,
  },
} satisfies ListDetailEntityDefinition;
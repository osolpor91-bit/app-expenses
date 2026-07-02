import { preventEditWhenSourceTypeIsPortal } from "@/lib/domain/businessRules";
import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

import {
  currencyOptions,
  purchaseDocumentTypeOptions,
  purchaseLineTypeOptions,
} from "@/lib/entityFields/commonOptions";

const preventPortalLineEditRule = preventEditWhenSourceTypeIsPortal({
  parentTable: "purchases_header",
  parentIdDbName: "purchase_header_id",
  applyOnCreate: true,
  applyOnDelete: true,
});

export const portalSupplierInvoiceFields: readonly EntityFieldDefinition[] = [
  {
    key: "document_type",
    dbName: "document_type",
    labelKey: "documentType",
    type: "option",
    required: true,
    newRowDefaultValue: "invoice",
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    options: purchaseDocumentTypeOptions,
  },
  {
    key: "invoice_no",
    dbName: "invoice_no",
    labelKey: "invoiceNo",
    type: "text",
    required: true,
    businessRules: [
      preventEditWhenSourceTypeIsPortal({
        applyOnDelete: true,
      }),
    ],
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "supplier_id",
    dbName: "supplier_id",
    labelKey: "supplierNo",
    type: "select",
    required: true,
    businessRules: [preventEditWhenSourceTypeIsPortal()],
    relation: {
      entityKey: "suppliers",
      displayFieldName: "supplier_display_name",
      relationDataFieldName: "suppliers",
      optionValueField: "id",
      optionLabelFieldNames: ["name"],
      labelSeparator: " - ",
      navigable: true,
    },

    showInList: true,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "country_id",
    dbName: "country_id",
    labelKey: "country",
    type: "select",
    required: false,
    createDefaultValueFromRelation: {
      relationFieldDbName: "supplier_id",
      sourceFieldDbName: "country_id",
      overwrite: "always",
    },
    relation: {
      entityKey: "countries",
      displayFieldName: "country_display",
      relationDataFieldName: "countries",
      optionValueField: "id",
      optionLabelFieldNames: ["code", "name"],
    },
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "payment_channel_id",
    dbName: "payment_channel_id",
    labelKey: "paymentChannel",
    type: "select",
    required: false,
    createDefaultValueFromRelation: {
      relationFieldDbName: "supplier_id",
      sourceFieldDbName: "payment_channel_id",
      overwrite: "always",
    },
    relation: {
      entityKey: "paymentChannels",
      displayFieldName: "payment_channel_display",
      relationDataFieldName: "payment_channels",
      optionValueField: "id",
      optionLabelFieldNames: ["code"],
    },
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "currency_code",
    dbName: "currency_code",
    labelKey: "currency",
    type: "option",
    required: true,
    createDefaultValueFromRelation: {
      relationFieldDbName: "supplier_id",
      sourceFieldDbName: "currency_code",
      overwrite: "always",
    },
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    options: currencyOptions,
  },
  {
    key: "tax_area_id",
    dbName: "tax_area_id",
    labelKey: "taxArea",
    type: "select",
    required: false,
    createDefaultValueFromRelation: {
      relationFieldDbName: "supplier_id",
      sourceFieldDbName: "tax_area_id",
      overwrite: "always",
    },
    relation: {
      entityKey: "taxAreas",
      displayFieldName: "tax_area_display",
      relationDataFieldName: "tax_areas",
      optionValueField: "id",
      optionLabelFieldNames: ["code"],
    },
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "exchange_rate",
    dbName: "exchange_rate",
    labelKey: "exchangeRate",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    decimalScale: 8,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    formVisibility: {
      dependsOnDbName: "currency_code",
      operator: "notEquals",
      contextValueKey: "activeCompanyCurrencyCode",
      hideWhenDependencyEmpty: true,
    },
  },
  {
    key: "posting_date",
    dbName: "posting_date",
    labelKey: "postingDate",
    type: "date",
    required: false,
    showInList: true,
    showInForm: false,
    showInFactBox: false,
  },
  {
    key: "invoice_date",
    dbName: "invoice_date",
    labelKey: "invoiceDate",
    type: "date",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "total_base_amount",
    dbName: "total_base_amount",
    labelKey: "totalBaseAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInList: true,
    showInForm: false,
    showInFactBox: true,
  },
  {
    key: "total_vat_amount",
    dbName: "total_vat_amount",
    labelKey: "totalVatAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInList: true,
    showInForm: false,
    showInFactBox: true,
  },
  {
    key: "total_amount",
    dbName: "total_amount",
    labelKey: "totalAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInList: true,
    showInForm: false,
    showInFactBox: true,
  },
  {
    key: "source_type",
    dbName: "source_type",
    labelKey: "sourceType",
    type: "option",
    required: false,
    editable: true,
    newRowDefaultValue: "portal",
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    options: [
      {
        value: "",
        labelKey: "sourceTypeBlank",
      },
      {
        value: "email",
        labelKey: "sourceTypeEmail",
      },
      {
        value: "portal",
        labelKey: "sourceTypePortal",
      },
      {
        value: "api",
        labelKey: "sourceTypeApi",
      },
      {
        value: "manual",
        labelKey: "sourceTypeManual",
      },
    ],
  },
  {
    key: "has_attachments",
    dbName: "has_attachments",
    labelKey: "hasAttachments",
    type: "boolean",
    required: false,
    editable: false,
    calculated: true,
    showInList: true,
    showInForm: false,
    showInFactBox: false,
  },
  {
    key: "status",
    dbName: "status",
    labelKey: "status",
    type: "text",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
];

export const portalSupplierInvoiceLineFields: readonly EntityFieldDefinition[] = [
  {
    key: "line_type",
    dbName: "line_type",
    labelKey: "lineType",
    type: "option",
    required: true,
    editable: true,
    options: purchaseLineTypeOptions,
    newRowDefaultValue: "item",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "sm",
    },
  },
  {
    key: "line_source_id",
    dbName: "line_source_id",
    labelKey: "lineNo",
    type: "select",
    required: true,
    editable: true,
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xl",
    },
  },
  {
    key: "fiscal_treatment_id",
    dbName: "fiscal_treatment_id",
    labelKey: "fiscalTreatment",
    type: "select",
    required: false,
    editable: true,
    relation: {
      entityKey: "fiscalTreatments",
      displayFieldName: "fiscal_treatment_display",
      relationDataFieldName: "fiscal_treatments",
      optionValueField: "id",
      optionLabelFieldNames: ["code"],
      navigable: true,
    },
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "md",
    },
  },
  {
    key: "description",
    dbName: "description",
    labelKey: "description",
    type: "text",
    required: false,
    editable: true,
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xl",
    },
  },
  {
    key: "quantity",
    dbName: "quantity",
    labelKey: "quantity",
    type: "integer",
    required: true,
    editable: true,
    validation: "digitsOnly",
    newRowDefaultValue: "1",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "unit_price",
    dbName: "unit_price",
    labelKey: "unitPrice",
    type: "decimal",
    required: false,
    editable: true,
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
  {
    key: "vat_rate",
    dbName: "vat_rate",
    labelKey: "vatRate",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    validation: "percentage",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "vat_amount",
    dbName: "vat_amount",
    labelKey: "vatAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
  {
    key: "total_amount",
    dbName: "total_amount",
    labelKey: "totalAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInGrid: true,
    grid: {
      width: "md",
      align: "right",
    },
  },
  {
    key: "discount_rate",
    dbName: "discount_rate",
    labelKey: "discountRate",
    type: "decimal",
    required: false,
    editable: true,
    validation: "percentage",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "discount_amount",
    dbName: "discount_amount",
    labelKey: "discountAmount",
    type: "decimal",
    required: false,
    editable: true,
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
  {
    key: "base_amount",
    dbName: "base_amount",
    labelKey: "baseAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
  {
    key: "equivalence_surcharge_rate",
    dbName: "equivalence_surcharge_rate",
    labelKey: "equivalenceSurchargeRate",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    validation: "percentage",
    newRowDefaultValue: "0",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "equivalence_surcharge_amount",
    dbName: "equivalence_surcharge_amount",
    labelKey: "equivalenceSurchargeAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
  {
    key: "withholding_rate",
    dbName: "withholding_rate",
    labelKey: "withholdingRate",
    type: "decimal",
    required: false,
    editable: true,
    validation: "percentage",
    newRowDefaultValue: "0",
    businessRules: [preventPortalLineEditRule],
    showInGrid: true,
    grid: {
      width: "xs",
      align: "right",
    },
  },
  {
    key: "withholding_amount",
    dbName: "withholding_amount",
    labelKey: "withholdingAmount",
    type: "decimal",
    required: false,
    editable: false,
    calculated: true,
    showInGrid: true,
    grid: {
      width: "sm",
      align: "right",
    },
  },
];

export const portalSupplierInvoiceSearchColumns = [
  "invoice_no",
  "status",
] as const;

export const portalSupplierInvoiceFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "documentType",
    column: "document_type",
    labelKey: "documentType",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "invoiceNo",
    column: "invoice_no",
    labelKey: "invoiceNo",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "postingDate",
    column: "posting_date",
    labelKey: "postingDate",
    type: "dateRange",
  },
  {
    paramName: "invoiceDate",
    column: "invoice_date",
    labelKey: "invoiceDate",
    type: "dateRange",
  },
  {
    paramName: "currencyCode",
    column: "currency_code",
    labelKey: "currency",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "totalBaseAmount",
    column: "total_base_amount",
    labelKey: "totalBaseAmount",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "status",
    column: "status",
    labelKey: "status",
    type: "text",
    operator: "ilike",
  },
];

export const portalSupplierInvoiceSelectColumns = getDbColumnsFromFields(
  portalSupplierInvoiceFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "created_at",
    "updated_at",
    "suppliers(tax_id, name)",
    "countries:country_id(id, code, name)",
    "payment_channels:payment_channel_id(id, code, description)",
    "tax_areas:tax_area_id(id, code, description)",
  ]
);

export const portalSupplierInvoiceLineSelectColumns = getDbColumnsFromFields(
  portalSupplierInvoiceLineFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "purchase_header_id",
    "created_at",
    "updated_at",
    "line_source_no",
    "fiscal_treatments:fiscal_treatment_id(id, code, description)",
  ]
);

export const portalSupplierInvoiceEntity = {
  key: "portalSupplierInvoices",
  table: "purchases_header",
  route: "/portal-supplier-invoices",
  labelsKey: "portalSupplierInvoices",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "invoice_no",
  newRoute: "/portal-supplier-invoices/new",

  fields: portalSupplierInvoiceFields,
  selectColumns: portalSupplierInvoiceSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: portalSupplierInvoiceSearchColumns,
  filters: portalSupplierInvoiceFilters,
  staticFilters: [
    {
      column: "source_type",
      value: "portal",
    },
  ],

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          { field: "supplier_id", colSpan: "full" },
          "document_type",
          "invoice_no",
          "country_id",
          "tax_area_id",
          "payment_channel_id",
          "currency_code",
          "invoice_date",
          "exchange_rate",
          "source_type",
          "status",
        ],
      },
    ],
  },

  subforms: [
    {
      key: "lines",
      table: "purchases_line",
      labelsKey: "portalSupplierInvoiceLines",
      parentIdDbName: "purchase_header_id",
      scope: "company",
      mode: "editable-grid",
      quickCreateOnTabFieldDbName: "unit_price",
      fields: portalSupplierInvoiceLineFields,
      selectColumns: portalSupplierInvoiceLineSelectColumns,
      updatedAtColumn: "updated_at",
      orderBy: {
        column: "created_at",
        ascending: true,
      },
    },
  ],

  factBoxes: [
    {
      key: "attachments",
      type: "document",
      table: "entity_attachments",
      entityTableDbName: "entity_table",
      parentIdDbName: "record_id",

      storageProviderDbName: "storage_provider",

      supabaseBucketDbName: "storage_bucket",
      supabasePathDbName: "file_path",

      sharepointWebUrlDbName: "external_url",

      originalFileNameDbName: "file_name",
      contentTypeDbName: "mime_type",
      sizeBytesDbName: "file_size",

      orderBy: {
        column: "created_at",
        ascending: false,
      },
    },
  ],

  orderBy: {
    column: "created_at",
    ascending: false,
  },
} satisfies ListDetailEntityDefinition;

export const purchaseInvoiceFields: readonly EntityFieldDefinition[] =
  portalSupplierInvoiceFields.map((field) =>
    field.dbName === "source_type"
      ? {
        ...field,
        newRowDefaultValue: "manual",
      }
      : field
  );

export const purchaseInvoiceEntity = {
  ...portalSupplierInvoiceEntity,

  key: "purchaseInvoices",
  route: "/purchase-invoices",
  labelsKey: "purchaseInvoices",
  newRoute: "/purchase-invoices/new",

  fields: purchaseInvoiceFields,
  staticFilters: [],
} satisfies ListDetailEntityDefinition;
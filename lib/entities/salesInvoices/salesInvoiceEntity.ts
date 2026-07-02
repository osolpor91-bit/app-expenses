import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const salesInvoiceFields: readonly EntityFieldDefinition[] = [
  {
    key: "invoice_no",
    dbName: "invoice_no",
    labelKey: "invoiceNo",
    type: "text",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
  {
    key: "customer_name",
    dbName: "customer_name",
    labelKey: "customerName",
    type: "text",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "posting_date",
    dbName: "posting_date",
    labelKey: "postingDate",
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
    showInForm: true,
    showInFactBox: true,
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

export const salesInvoiceLineFields: readonly EntityFieldDefinition[] = [
  {
    key: "base_amount",
    dbName: "base_amount",
    labelKey: "baseAmount",
    type: "decimal",
    required: false,
    editable: true,
    showInGrid: true,
  },
];

export const salesInvoiceSearchColumns = [
  "invoice_no",
  "customer_name",
  "status",
] as const;

export const salesInvoiceFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "invoiceNo",
    column: "invoice_no",
    labelKey: "invoiceNo",
    type: "text",
    operator: "ilike",
  },
  {
    paramName: "customerName",
    column: "customer_name",
    labelKey: "customerName",
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
    paramName: "status",
    column: "status",
    labelKey: "status",
    type: "text",
    operator: "ilike",
  },
];

export const salesInvoiceSelectColumns = getDbColumnsFromFields(
  salesInvoiceFields,
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const salesInvoiceLineSelectColumns = getDbColumnsFromFields(
  salesInvoiceLineFields,
  [
    "id",
    "tenant_id",
    "company_id",
    "sales_invoice_id",
    "created_at",
    "updated_at",
  ]
);

export const salesInvoiceEntity = {
  key: "salesInvoices",
  table: "sales_invoices",
  route: "/sales-invoices",
  labelsKey: "salesInvoices",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "invoice_no",
  newRoute: "/sales-invoices/new",

  fields: salesInvoiceFields,
  selectColumns: salesInvoiceSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: salesInvoiceSearchColumns,
  filters: salesInvoiceFilters,

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          "invoice_no",
          { field: "customer_name", colSpan: "full" },
          "posting_date",
          "total_base_amount",
          "status",
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

  subforms: [
    {
      key: "lines",
      table: "sales_invoices_line",
      labelsKey: "salesInvoiceLines",
      parentIdDbName: "sales_invoice_id",
      scope: "company",
      mode: "editable-grid",
      fields: salesInvoiceLineFields,
      selectColumns: salesInvoiceLineSelectColumns,
      updatedAtColumn: "updated_at",
      orderBy: {
        column: "created_at",
        ascending: true,
      },
    },
  ],

  orderBy: {
    column: "invoice_no",
    ascending: true,
  },
} satisfies ListDetailEntityDefinition;
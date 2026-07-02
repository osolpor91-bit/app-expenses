import { getDbColumnsFromFields } from "@/lib/entityFields/helpers";
import type { EntityFieldDefinition } from "@/lib/entityFields/types";
import type { ListDetailEntityDefinition } from "@/lib/entities/core/entityDefinition";
import type { EntityFilterDefinition } from "@/lib/search/databaseFilters";

export const emailConfigurationFields: readonly EntityFieldDefinition[] = [
  {
    key: "application_area",
    dbName: "application_area",
    labelKey: "applicationArea",
    type: "option",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    newRowDefaultValue: "purchasing",
    options: [
      {
        value: "purchasing",
        labelKey: "applicationAreaPurchasing",
      },
      {
        value: "sales",
        labelKey: "applicationAreaSales",
      },
    ],
  },
  {
    key: "provider_type",
    dbName: "provider_type",
    labelKey: "providerType",
    type: "option",
    required: true,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    newRowDefaultValue: "smtp",
    options: [
      {
        value: "smtp",
        labelKey: "providerTypeSmtp",
      },
      {
        value: "microsoft_graph",
        labelKey: "providerTypeMicrosoftGraph",
      },
    ],
  },
  {
    key: "auth_type",
    dbName: "auth_type",
    labelKey: "authType",
    type: "option",
    required: true,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    newRowDefaultValue: "basic",
    options: [
      {
        value: "basic",
        labelKey: "authTypeBasic",
      },
      {
        value: "oauth_client_credentials",
        labelKey: "authTypeOauthClientCredentials",
      },
    ],
  },
  {
    key: "sender_email",
    dbName: "sender_email",
    labelKey: "senderEmail",
    type: "email",
    validation: "email",
    required: true,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "sender_name",
    dbName: "sender_name",
    labelKey: "senderName",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: true,
    formColSpan: "full",
  },
  {
    key: "smtp_host",
    dbName: "smtp_host",
    labelKey: "smtpHost",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "smtp_port",
    dbName: "smtp_port",
    labelKey: "smtpPort",
    type: "text",
    validation: "smtpPort",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
  },
  {
    key: "smtp_username",
    dbName: "smtp_username",
    labelKey: "smtpUsername",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "smtp_security_type",
    dbName: "smtp_security_type",
    labelKey: "smtpSecurityType",
    type: "option",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    options: [
      {
        value: "",
        labelKey: "smtpSecurityTypeBlank",
      },
      {
        value: "none",
        labelKey: "smtpSecurityTypeNone",
      },
      {
        value: "ssl_tls",
        labelKey: "smtpSecurityTypeSslTls",
      },
      {
        value: "starttls",
        labelKey: "smtpSecurityTypeStartTls",
      },
    ],
  },
  {
    key: "microsoft_tenant_id",
    dbName: "microsoft_tenant_id",
    labelKey: "microsoftTenantId",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "microsoft_client_id",
    dbName: "microsoft_client_id",
    labelKey: "microsoftClientId",
    type: "text",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "microsoft_mailbox_email",
    dbName: "microsoft_mailbox_email",
    labelKey: "microsoftMailboxEmail",
    type: "email",
    validation: "email",
    required: false,
    showInList: false,
    showInForm: true,
    showInFactBox: false,
    formColSpan: "full",
  },
  {
    key: "is_active",
    dbName: "is_active",
    labelKey: "isActive",
    type: "boolean",
    required: false,
    showInList: true,
    showInForm: true,
    showInFactBox: true,
  },
];

export const emailConfigurationSearchColumns = [
  "application_area",
  "sender_email",
  "sender_name",
  "smtp_host",
  "microsoft_mailbox_email",
] as const;

export const emailConfigurationFilters: readonly EntityFilterDefinition[] = [
  {
    paramName: "applicationArea",
    column: "application_area",
    labelKey: "applicationArea",
    type: "text",
    operator: "eq",
  },
  {
    paramName: "senderEmail",
    column: "sender_email",
    labelKey: "senderEmail",
    type: "text",
    operator: "ilike",
  },
];

export const emailConfigurationSelectColumns = getDbColumnsFromFields(
  emailConfigurationFields,
  ["id", "tenant_id", "company_id", "created_at", "updated_at"]
);

export const emailConfigurationEntity = {
  key: "emailConfigurations",
  table: "email_configurations",
  route: "/email-configurations",
  labelsKey: "emailConfigurations",
  scope: "company",
  pageMode: "list-detail",

  primaryFieldDbName: "application_area",
  newRoute: "/email-configurations/new",

  fields: emailConfigurationFields,
  selectColumns: emailConfigurationSelectColumns,
  updatedAtColumn: "updated_at",

  searchColumns: emailConfigurationSearchColumns,
  filters: emailConfigurationFilters,

  formLayout: {
    type: "sections",
    sections: [
      {
        key: "general",
        labelKey: "sectionGeneral",
        columns: 2,
        fields: [
          "application_area",
          "provider_type",
          "auth_type",
          { field: "sender_email", colSpan: "full" },
          { field: "sender_name", colSpan: "full" },
          { field: "smtp_host", colSpan: "full" },
          "smtp_port",
          "smtp_security_type",
          { field: "smtp_username", colSpan: "full" },
          { field: "microsoft_tenant_id", colSpan: "full" },
          { field: "microsoft_client_id", colSpan: "full" },
          { field: "microsoft_mailbox_email", colSpan: "full" },
          "is_active",
        ],
      },
    ],
  },

  factBoxes: [],

  orderBy: {
    column: "application_area",
    ascending: true,
  },
} satisfies ListDetailEntityDefinition;
import type { EntityFieldDefinition } from "@/lib/entityFields/types";

export const emailSendLogFields: readonly EntityFieldDefinition[] = [
  {
    key: "related_type",
    dbName: "related_type",
    labelKey: "relatedType",
    type: "option",
    required: true,
    showInList: true,
    showInForm: false,
    options: [
      {
        value: "table",
        labelKey: "relatedTypeTable",
      },
      {
        value: "report",
        labelKey: "relatedTypeReport",
      },
    ],
  },
  {
    key: "related_name",
    dbName: "related_name",
    labelKey: "relatedName",
    type: "text",
    required: true,
    showInList: true,
    showInForm: false,
  },
  {
    key: "related_record_id",
    dbName: "related_record_id",
    labelKey: "relatedRecordId",
    type: "text",
    required: false,
    showInList: true,
    showInForm: false,
  },
  {
    key: "sender_email",
    dbName: "sender_email",
    labelKey: "senderEmail",
    type: "email",
    required: true,
    showInList: true,
    showInForm: false,
  },
  {
    key: "recipient_email",
    dbName: "recipient_email",
    labelKey: "recipientEmail",
    type: "email",
    required: true,
    showInList: true,
    showInForm: false,
  },
  {
    key: "sent_at",
    dbName: "sent_at",
    labelKey: "sentAt",
    type: "text",
    required: true,
    showInList: true,
    showInForm: false,
  },
];
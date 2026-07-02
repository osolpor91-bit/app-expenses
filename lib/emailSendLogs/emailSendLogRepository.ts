import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";

export type EmailSendLogRelatedType = "table" | "report";

export type CreateEmailSendLogInput = {
  relatedType: EmailSendLogRelatedType;
  relatedName: string;
  relatedRecordId?: string | null;
  senderEmail: string;
  recipientEmail: string;
};

export type EmailSendLogRecord = {
  id: string;
  tenant_id: string;
  company_id: string;
  related_type: EmailSendLogRelatedType;
  related_name: string;
  related_record_id: string | null;
  sender_email: string;
  recipient_email: string;
  sent_at: string;
};

type CreateEmailSendLogParams = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  input: CreateEmailSendLogInput;
};

type ListEmailSendLogsParams = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  filters?: {
    relatedType?: string | null;
    relatedName?: string | null;
    relatedRecordId?: string | null;
  };
};

function getTableQuery(supabase: SupabaseServerClient, table: string) {
  return (supabase as any).from(table);
}

export async function createEmailSendLog({
  supabase,
  context,
  input,
}: CreateEmailSendLogParams) {
  if (!context.companyId) {
    return {
      data: null,
      error: {
        message: "No hay empresa activa.",
      },
    };
  }

  return getTableQuery(supabase, "email_send_logs").insert({
    tenant_id: context.tenantId,
    company_id: context.companyId,
    related_type: input.relatedType,
    related_name: input.relatedName,
    related_record_id: input.relatedRecordId ?? null,
    sender_email: input.senderEmail,
    recipient_email: input.recipientEmail,
  });
}

export async function listEmailSendLogs({
  supabase,
  context,
  filters,
}: ListEmailSendLogsParams) {
  if (!context.companyId) {
    return {
      data: [],
      error: null,
    };
  }

  let query = getTableQuery(supabase, "email_send_logs")
    .select(
      [
        "id",
        "tenant_id",
        "company_id",
        "related_type",
        "related_name",
        "related_record_id",
        "sender_email",
        "recipient_email",
        "sent_at",
      ].join(", ")
    )
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .order("sent_at", {
      ascending: false,
    });

  if (filters?.relatedType) {
    query = query.eq("related_type", filters.relatedType);
  }

  if (filters?.relatedName) {
    query = query.eq("related_name", filters.relatedName);
  }

  if (filters?.relatedRecordId) {
    query = query.eq("related_record_id", filters.relatedRecordId);
  }

  return query;
}
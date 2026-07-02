import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import { sendTransactionalEmail } from "@/lib/email/transactionalEmailService";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

type EmailConfigurationRecord = {
  id: string;
  tenant_id: string;
  company_id: string;
  application_area: string;
  provider_type: string | null;
  auth_type: string | null;
  sender_email: string | null;
  sender_name: string | null;
  smtp_host: string | null;
  smtp_port: string | null;
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_security_type: string | null;
  microsoft_tenant_id: string | null;
  microsoft_client_id: string | null;
  microsoft_client_secret: string | null;
  microsoft_mailbox_email: string | null;
  is_active: boolean | null;
};

type LoadEmailConfigurationByIdParams = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  id: string;
};

type SendEmailConfigurationTestEmailParams = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  id: string;
  destinationEmail: string;
};

function getTableQuery(supabase: SupabaseServerClient, table: string) {
  return (supabase as any).from(table);
}

function isRecord(value: unknown): value is EmailConfigurationRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRequiredText(
  record: EmailConfigurationRecord,
  key: keyof EmailConfigurationRecord
) {
  return String(record[key] ?? "").trim();
}

function getApplicationAreaLabel(applicationArea: string) {
  if (applicationArea === "purchasing") {
    return "Compras";
  }

  if (applicationArea === "sales") {
    return "Ventas";
  }

  return applicationArea;
}

function isValidEmail(value: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim());
}

async function loadEmailConfigurationById({
  supabase,
  context,
  id,
}: LoadEmailConfigurationByIdParams): Promise<
  EntityOperationResult<{ record: EmailConfigurationRecord }>
> {
  if (!context.companyId) {
    return entityOperationError("No hay empresa activa.");
  }

  const { data, error } = await getTableQuery(supabase, "email_configurations")
    .select(
      [
        "id",
        "tenant_id",
        "company_id",
        "application_area",
        "provider_type",
        "auth_type",
        "sender_email",
        "sender_name",
        "smtp_host",
        "smtp_port",
        "smtp_username",
        "smtp_password",
        "smtp_security_type",
        "microsoft_tenant_id",
        "microsoft_client_id",
        "microsoft_client_secret",
        "microsoft_mailbox_email",
        "is_active",
      ].join(", ")
    )
    .eq("id", id)
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .single();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!isRecord(data)) {
    return entityOperationError(
      "No se ha podido leer la configuración de correo."
    );
  }

  return entityOperationOk({
    record: data,
  });
}

export async function sendEmailConfigurationTestEmail({
  supabase,
  context,
  id,
  destinationEmail,
}: SendEmailConfigurationTestEmailParams): Promise<EntityOperationResult<null>> {
  const normalizedDestinationEmail = destinationEmail.trim().toLowerCase();

  if (!isValidEmail(normalizedDestinationEmail)) {
    return entityOperationError("El correo destino no es válido.");
  }

  const configurationResult = await loadEmailConfigurationById({
    supabase,
    context,
    id,
  });

  if (!configurationResult.ok) {
    return configurationResult;
  }

  const { record } = configurationResult.data;

  const providerType = getRequiredText(record, "provider_type") || "smtp";
  const authType = getRequiredText(record, "auth_type") || "basic";

  if (providerType !== "smtp" || authType !== "basic") {
    return entityOperationError(
      "El envío de prueba solo está implementado todavía para SMTP con usuario y contraseña. Microsoft 365 / Graph queda preparado para una fase posterior."
    );
  }

  const applicationAreaLabel = getApplicationAreaLabel(record.application_area);
  const senderEmail = getRequiredText(record, "sender_email").toLowerCase();

  const text = [
    "Este es un correo de prueba enviado desde Osolpor.",
    "",
    `Área funcional: ${applicationAreaLabel}`,
    `Correo remitente: ${senderEmail}`,
    "",
    "Si has recibido este mensaje, la configuración de correo funciona correctamente.",
  ].join("\n");

  const sendResult = await sendTransactionalEmail({
    supabase,
    context,
    input: {
      applicationArea:
        record.application_area === "sales" ? "sales" : "purchasing",
      to: normalizedDestinationEmail,
      subject: "Prueba de configuración de correo",
      text,
      html: text.replace(/\n/g, "<br />"),
      relatedTarget: {
        relatedType: "table",
        relatedName: "email_configurations",
        relatedRecordId: record.id,
      },
    },
  });

  if (!sendResult.ok) {
    return sendResult;
  }

  return entityOperationOk(null);
}

export async function updateEmailConfigurationSmtpPassword({
  supabase,
  context,
  id,
  password,
}: LoadEmailConfigurationByIdParams & {
  password: string;
}): Promise<EntityOperationResult<null>> {
  if (!context.companyId) {
    return entityOperationError("No hay empresa activa.");
  }

  if (!password) {
    return entityOperationError("La contraseña SMTP no puede estar vacía.");
  }

  const { error } = await getTableQuery(supabase, "email_configurations")
    .update({
      smtp_password: password,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId);

  if (error) {
    return entityOperationError(error.message);
  }

  return entityOperationOk(null);
}

export async function updateEmailConfigurationMicrosoftClientSecret({
  supabase,
  context,
  id,
  clientSecret,
}: LoadEmailConfigurationByIdParams & {
  clientSecret: string;
}): Promise<EntityOperationResult<null>> {
  if (!context.companyId) {
    return entityOperationError("No hay empresa activa.");
  }

  if (!clientSecret) {
    return entityOperationError(
      "El secreto de cliente Microsoft no puede estar vacío."
    );
  }

  const { error } = await getTableQuery(supabase, "email_configurations")
    .update({
      microsoft_client_secret: clientSecret,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId);

  if (error) {
    return entityOperationError(error.message);
  }

  return entityOperationOk(null);
}
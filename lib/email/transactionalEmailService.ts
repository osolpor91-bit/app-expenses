import { sendSmtpEmail, type SmtpSecurityType } from "@/lib/email/sendSmtpEmail";
import { createEmailSendLog } from "@/lib/emailSendLogs/emailSendLogRepository";
import type {
  EntityScopeContext,
  SupabaseServerClient,
} from "@/lib/entities/core/entityRepository";
import {
  entityOperationError,
  entityOperationOk,
  type EntityOperationResult,
} from "@/lib/services/entityService";

export type EmailApplicationArea = "purchasing" | "sales";

export type SendTransactionalEmailRelatedTarget = {
  relatedType: "table" | "report";
  relatedName: string;
  relatedRecordId?: string | null;
};

export type SendTransactionalEmailInput = {
  applicationArea: EmailApplicationArea;
  to: string;
  subject: string;
  text: string;
  html?: string;
  relatedTarget?: SendTransactionalEmailRelatedTarget | null;
};

type EmailConfigurationRecord = {
  id: string;
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
  is_active: boolean | null;
};

type SendTransactionalEmailParams = {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  input: SendTransactionalEmailInput;
};

function getTableQuery(supabase: SupabaseServerClient, table: string) {
  return (supabase as any).from(table);
}

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim());
}

function getRequiredText(
  record: EmailConfigurationRecord,
  key: keyof EmailConfigurationRecord
) {
  return String(record[key] ?? "").trim();
}

function normalizeSmtpSecurityType(value: string): SmtpSecurityType | null {
  if (value === "none" || value === "ssl_tls" || value === "starttls") {
    return value;
  }

  return null;
}

function getApplicationAreaLabel(applicationArea: EmailApplicationArea) {
  if (applicationArea === "purchasing") {
    return "Compras";
  }

  if (applicationArea === "sales") {
    return "Ventas";
  }

  return applicationArea;
}

async function loadActiveEmailConfiguration({
  supabase,
  context,
  applicationArea,
}: {
  supabase: SupabaseServerClient;
  context: EntityScopeContext;
  applicationArea: EmailApplicationArea;
}): Promise<EntityOperationResult<{ record: EmailConfigurationRecord }>> {
  if (!context.companyId) {
    return entityOperationError("No hay empresa activa.");
  }

  const { data, error } = await getTableQuery(supabase, "email_configurations")
    .select(
      [
        "id",
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
        "is_active",
      ].join(", ")
    )
    .eq("tenant_id", context.tenantId)
    .eq("company_id", context.companyId)
    .eq("application_area", applicationArea)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return entityOperationError(error.message);
  }

  if (!data) {
    return entityOperationError(
      `No hay una configuración de correo activa para ${getApplicationAreaLabel(
        applicationArea
      )}.`
    );
  }

  return entityOperationOk({
    record: data as EmailConfigurationRecord,
  });
}

function validateSmtpBasicConfiguration({
  record,
  applicationArea,
}: {
  record: EmailConfigurationRecord;
  applicationArea: EmailApplicationArea;
}): EntityOperationResult<{
  senderEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecurityType: SmtpSecurityType;
}> {
  const providerType = getRequiredText(record, "provider_type") || "smtp";
  const authType = getRequiredText(record, "auth_type") || "basic";

  if (providerType !== "smtp" || authType !== "basic") {
    return entityOperationError(
      `El envío de correo para ${getApplicationAreaLabel(
        applicationArea
      )} solo está implementado todavía para SMTP con usuario y contraseña.`
    );
  }

  const missingFields: string[] = [];

  if (!getRequiredText(record, "sender_email")) {
    missingFields.push("Correo");
  }

  if (!getRequiredText(record, "smtp_host")) {
    missingFields.push("Servidor SMTP");
  }

  if (!getRequiredText(record, "smtp_port")) {
    missingFields.push("Puerto");
  }

  if (!getRequiredText(record, "smtp_username")) {
    missingFields.push("Usuario SMTP");
  }

  if (!String(record.smtp_password ?? "")) {
    missingFields.push("Contraseña SMTP");
  }

  if (!getRequiredText(record, "smtp_security_type")) {
    missingFields.push("Tipo de seguridad");
  }

  if (missingFields.length > 0) {
    return entityOperationError(
      `La configuración de correo de ${getApplicationAreaLabel(
        applicationArea
      )} está incompleta: ${missingFields.join(", ")}.`
    );
  }

  const senderEmail = normalizeEmail(record.sender_email);

  if (!isValidEmail(senderEmail)) {
    return entityOperationError(
      `El correo remitente de ${getApplicationAreaLabel(
        applicationArea
      )} no es válido.`
    );
  }

  const smtpPort = Number(getRequiredText(record, "smtp_port"));

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    return entityOperationError(
      `El puerto SMTP de ${getApplicationAreaLabel(applicationArea)} no es válido.`
    );
  }

  const smtpSecurityType = normalizeSmtpSecurityType(
    getRequiredText(record, "smtp_security_type")
  );

  if (!smtpSecurityType) {
    return entityOperationError(
      `El tipo de seguridad SMTP de ${getApplicationAreaLabel(
        applicationArea
      )} no es válido.`
    );
  }

  return entityOperationOk({
    senderEmail,
    smtpHost: getRequiredText(record, "smtp_host"),
    smtpPort,
    smtpUsername: getRequiredText(record, "smtp_username"),
    smtpPassword: String(record.smtp_password ?? ""),
    smtpSecurityType,
  });
}

export async function sendTransactionalEmail({
  supabase,
  context,
  input,
}: SendTransactionalEmailParams): Promise<
  EntityOperationResult<{ senderEmail: string; recipientEmail: string }>
> {
  const recipientEmail = normalizeEmail(input.to);

  if (!isValidEmail(recipientEmail)) {
    return entityOperationError("El correo destinatario no es válido.");
  }

  const configurationResult = await loadActiveEmailConfiguration({
    supabase,
    context,
    applicationArea: input.applicationArea,
  });

  if (!configurationResult.ok) {
    return configurationResult;
  }

  const { record } = configurationResult.data;

  const smtpConfigurationResult = validateSmtpBasicConfiguration({
    record,
    applicationArea: input.applicationArea,
  });

  if (!smtpConfigurationResult.ok) {
    return smtpConfigurationResult;
  }

  const smtpConfiguration = smtpConfigurationResult.data;

  try {
    await sendSmtpEmail({
      host: smtpConfiguration.smtpHost,
      port: smtpConfiguration.smtpPort,
      securityType: smtpConfiguration.smtpSecurityType,
      username: smtpConfiguration.smtpUsername,
      password: smtpConfiguration.smtpPassword,
      fromEmail: smtpConfiguration.senderEmail,
      fromName: record.sender_name,
      to: recipientEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    return entityOperationError(
      `No se pudo enviar el correo. Revisa la configuración de ${getApplicationAreaLabel(
        input.applicationArea
      )}. Detalle: ${message}`
    );
  }

  if (input.relatedTarget) {
    const logResult = await createEmailSendLog({
      supabase,
      context,
      input: {
        relatedType: input.relatedTarget.relatedType,
        relatedName: input.relatedTarget.relatedName,
        relatedRecordId: input.relatedTarget.relatedRecordId ?? null,
        senderEmail: smtpConfiguration.senderEmail,
        recipientEmail,
      },
    });

    if (logResult.error) {
      return entityOperationError(
        `El correo se envió correctamente, pero no se pudo registrar el log: ${logResult.error.message}`
      );
    }
  }

  return entityOperationOk({
    senderEmail: smtpConfiguration.senderEmail,
    recipientEmail,
  });
}
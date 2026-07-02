"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import {
  sendEmailConfigurationTestEmail,
  updateEmailConfigurationMicrosoftClientSecret,
  updateEmailConfigurationSmtpPassword,
} from "@/lib/email/emailConfigurationService";
import {
  entityOperationError,
  type EntityOperationResult,
} from "@/lib/services/entityService";

export async function sendEmailConfigurationTestEmailAction({
  id,
  destinationEmail,
}: {
  id: string;
  destinationEmail: string;
}): Promise<EntityOperationResult<null>> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("No hay empresa activa.");
  }

  return sendEmailConfigurationTestEmail({
    supabase,
    context: {
      tenantId: tenant.id,
      companyId: activeCompany.id,
    },
    id,
    destinationEmail,
  });
}

export async function updateEmailConfigurationSmtpPasswordAction({
  id,
  password,
}: {
  id: string;
  password: string;
}): Promise<EntityOperationResult<null>> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("No hay empresa activa.");
  }

  const result = await updateEmailConfigurationSmtpPassword({
    supabase,
    context: {
      tenantId: tenant.id,
      companyId: activeCompany.id,
    },
    id,
    password,
  });

  if (result.ok) {
    revalidatePath(`/email-configurations/${id}`);
  }

  return result;
}

export async function updateEmailConfigurationMicrosoftClientSecretAction({
  id,
  clientSecret,
}: {
  id: string;
  clientSecret: string;
}): Promise<EntityOperationResult<null>> {
  const { supabase, tenant, activeCompany } = await requireCompanyContext();

  if (!activeCompany) {
    return entityOperationError("No hay empresa activa.");
  }

  const result = await updateEmailConfigurationMicrosoftClientSecret({
    supabase,
    context: {
      tenantId: tenant.id,
      companyId: activeCompany.id,
    },
    id,
    clientSecret,
  });

  if (result.ok) {
    revalidatePath(`/email-configurations/${id}`);
  }

  return result;
}
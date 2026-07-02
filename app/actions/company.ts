"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireTenant } from "@/lib/auth/requireTenant";
import { activeCompanyCookieName } from "@/lib/company/requireCompanyContext";
import { getCompanyIdForTenant } from "@/lib/repositories/companiesRepository";

function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function setActiveCompanyAction(formData: FormData) {
  const rawCompanyId = formData.get("companyId");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  if (typeof rawCompanyId !== "string" || !rawCompanyId) {
    redirect(redirectTo);
  }

  const { supabase, tenant } = await requireTenant();

  const { data: company, error } = await getCompanyIdForTenant({
    supabase,
    tenantId: tenant.id,
    companyId: rawCompanyId,
  });

  if (error) {
    throw new Error(`Error validando empresa activa: ${error.message}`);
  }

  if (!company) {
    redirect(redirectTo);
  }

  const cookieStore = await cookies();

  cookieStore.set(activeCompanyCookieName, rawCompanyId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(redirectTo);
}
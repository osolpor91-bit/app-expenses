"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUserById } from "@/lib/admin/authUsers";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import {
  getAdminTenantIdById,
  getAdminTenantUserAssignment,
  insertAdminTenantUserAssignment,
  updateAdminTenantUserAssignment,
} from "@/lib/repositories/adminTablesRepository";

const allowedRoles = new Set(["owner", "admin", "member", "readonly"]);

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Falta el valor obligatorio: ${key}.`);
  }

  return value.trim();
}

export async function assignTenantToUserAction(formData: FormData) {
  await requirePlatformAdmin();

  const userId = getRequiredString(formData, "userId");
  const tenantId = getRequiredString(formData, "tenantId");
  const rawRole = getRequiredString(formData, "role");

  const role = allowedRoles.has(rawRole) ? rawRole : "member";

  const { data: authUserData, error: authUserError } =
    await getAuthUserById(userId);

  if (authUserError || !authUserData.user) {
    throw new Error(
      `No se ha podido validar el usuario de Auth: ${
        authUserError?.message ?? "usuario no encontrado"
      }`
    );
  }

  const { data: tenant, error: tenantError } = await getAdminTenantIdById({
    tenantId,
  });

  if (tenantError) {
    throw new Error(`Error validando tenant: ${tenantError.message}`);
  }

  if (!tenant) {
    throw new Error("El tenant seleccionado no existe.");
  }

  const { data: existingTenantUser, error: existingTenantUserError } =
    await getAdminTenantUserAssignment({
      userId,
      tenantId,
    });

  if (existingTenantUserError) {
    throw new Error(
      `Error comprobando usuario del tenant: ${existingTenantUserError.message}`
    );
  }

  if (existingTenantUser) {
    const { error: updateError } = await updateAdminTenantUserAssignment({
      userId,
      tenantId,
      role,
    });

    if (updateError) {
      throw new Error(`Error actualizando usuario: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await insertAdminTenantUserAssignment({
      userId,
      tenantId,
      role,
    });

    if (insertError) {
      throw new Error(`Error asignando tenant al usuario: ${insertError.message}`);
    }
  }

  revalidatePath("/admin/users-without-tenant");
  revalidatePath("/admin/tenant-users");

  redirect("/admin/users-without-tenant?assigned=1");
}
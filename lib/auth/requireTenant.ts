import { cache } from "react";
import { redirect } from "next/navigation";

import {
  getActiveTenantUserWithTenant,
  type ActiveTenantUserWithTenantRow,
  type TenantRelationRow,
} from "@/lib/repositories/tenantUsersRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CurrentTenant = {
  id: string;
  name: string;
  slug: string;
};

export type CurrentUserTenantContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: {
    id: string;
    email?: string;
  };
  tenant: CurrentTenant;
  role: string;
};

function getTenantFromTenantUser(
  tenantUser: ActiveTenantUserWithTenantRow
): TenantRelationRow | null {
  if (!tenantUser.tenants) {
    return null;
  }

  return Array.isArray(tenantUser.tenants)
    ? tenantUser.tenants[0] ?? null
    : tenantUser.tenants;
}

async function requireTenantImpl(): Promise<CurrentUserTenantContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: tenantUserData, error: tenantUserError } =
    await getActiveTenantUserWithTenant({
      supabase,
      userId: user.id,
    });

  if (tenantUserError) {
    throw new Error(
      `Error leyendo tenant del usuario: ${tenantUserError.message}`
    );
  }

  const tenantUser = tenantUserData as ActiveTenantUserWithTenantRow | null;

  if (!tenantUser || !tenantUser.tenants) {
    redirect("/account-pending");
  }

  const tenant = getTenantFromTenantUser(tenantUser);

  if (!tenant) {
    throw new Error("No se ha podido obtener el tenant del usuario.");
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    tenant,
    role: tenantUser.role,
  };
}

export const requireTenant = cache(requireTenantImpl);
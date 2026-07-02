import { notFound } from "next/navigation";

import {
  canAccessTenantPage,
  type TenantPage,
} from "@/lib/auth/tenantRolePermissions";
import { requireTenant } from "@/lib/auth/requireTenant";

export async function requireTenantPageAccess(page: TenantPage) {
  const context = await requireTenant();

  if (!canAccessTenantPage(context.role, page)) {
    notFound();
  }

  return context;
}

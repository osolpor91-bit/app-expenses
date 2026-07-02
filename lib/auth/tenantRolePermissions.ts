export type TenantPage = "admin" | "configurations" | "dashboard";

const allTenantPages: readonly TenantPage[] = [
  "admin",
  "configurations",
  "dashboard",
];

const standardTenantPages: readonly TenantPage[] = [
  "configurations",
  "dashboard",
];

const tenantRolePages: Record<string, readonly TenantPage[]> = {
  owner: standardTenantPages,
  admin: allTenantPages,
  member: standardTenantPages,
  readonly: standardTenantPages,
};

export function canAccessTenantPage(
  role: string | null | undefined,
  page: TenantPage
) {
  if (!role) {
    return false;
  }

  return tenantRolePages[role]?.includes(page) ?? false;
}

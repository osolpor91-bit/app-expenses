export function isTenantAdministratorRole(role: string | null | undefined) {
  return role === "owner" || role === "admin";
}
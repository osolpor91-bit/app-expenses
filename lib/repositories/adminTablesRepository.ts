import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function listAdminTenantUsersWithTenants() {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenant_users")
    .select("user_id, tenant_id, role, status, tenants(id, name, slug)")
    .order("tenant_id", { ascending: true });
}

export async function listAdminTenants() {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenants")
    .select("id, name, slug, status, created_at")
    .order("name", { ascending: true });
}

export async function listActiveTenantUserIdsForAdmin() {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenant_users")
    .select("user_id")
    .eq("status", "active");
}

export async function listAdminTenantOptionsForAssignment() {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenants")
    .select("id, name, slug")
    .order("name", { ascending: true });
}

export async function getAdminTenantIdById({
  tenantId,
}: {
  tenantId: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();
}

export async function getAdminTenantUserAssignment({
  userId,
  tenantId,
}: {
  userId: string;
  tenantId: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenant_users")
    .select("user_id, tenant_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
}

export async function updateAdminTenantUserAssignment({
  userId,
  tenantId,
  role,
}: {
  userId: string;
  tenantId: string;
  role: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenant_users")
    .update({
      role,
      status: "active",
    })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
}

export async function insertAdminTenantUserAssignment({
  userId,
  tenantId,
  role,
}: {
  userId: string;
  tenantId: string;
  role: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin.from("tenant_users").insert({
    user_id: userId,
    tenant_id: tenantId,
    role,
    status: "active",
  });
}

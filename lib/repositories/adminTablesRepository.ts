import type { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export async function listAdminProducts({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function listAdminPlans({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function listAdminPlanProducts({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("plan_products")
    .select("plan:plans(code, name), product:products(code, name)")
    .order("created_at", { ascending: false });
}

export async function listAdminSubscriptions({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("subscriptions")
    .select(
      `
        id,
        tenant_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        created_at,
        tenant:tenants(name, slug),
        plan:plans(code, name)
      `
    )
    .order("created_at", { ascending: false });
}

export async function listAdminTenantProducts({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
    .from("tenant_products")
    .select(
      `
        id,
        tenant_id,
        product_id,
        status,
        created_at,
        updated_at,
        tenant:tenants(name, slug),
        product:products(code, name)
      `
    )
    .order("created_at", { ascending: false });
}

export async function listAdminTenantUsersWithTenants() {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin
    .from("tenant_users")
    .select("user_id, tenant_id, role, status, tenants(id, name, slug)")
    .order("tenant_id", { ascending: true });
}

export async function listAdminTenants({
  supabase,
}: {
  supabase: SupabaseServerClient;
}) {
  return supabase
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
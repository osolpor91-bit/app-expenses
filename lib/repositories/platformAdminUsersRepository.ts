import type { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type ActivePlatformAdminUserRow = {
  id?: string;
  role: string;
};

export async function getActivePlatformAdminUser({
  supabase,
  userId,
}: {
  supabase: SupabaseServerClient;
  userId: string;
}) {
  return supabase
    .from("platform_admin_users")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
}

export async function getActivePlatformAdminUserId({
  supabase,
  userId,
}: {
  supabase: SupabaseServerClient;
  userId: string;
}) {
  return supabase
    .from("platform_admin_users")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
}
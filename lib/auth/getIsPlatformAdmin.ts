import { getActivePlatformAdminUserId } from "@/lib/repositories/platformAdminUsersRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export async function getIsPlatformAdmin(
  supabaseClient?: SupabaseServerClient,
  userId?: string
): Promise<boolean> {
  const supabase = supabaseClient ?? (await createSupabaseServerClient());

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    resolvedUserId = user.id;
  }

  const { data, error } = await getActivePlatformAdminUserId({
    supabase,
    userId: resolvedUserId,
  });

  if (error) {
    return false;
  }

  return Boolean(data);
}
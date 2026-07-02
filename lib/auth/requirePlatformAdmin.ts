import { notFound, redirect } from "next/navigation";

import { getActivePlatformAdminUser } from "@/lib/repositories/platformAdminUsersRepository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CurrentPlatformAdminContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: {
    id: string;
    email?: string;
  };
  platformRole: string;
};

export async function requirePlatformAdmin(): Promise<CurrentPlatformAdminContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: platformAdmin, error: platformAdminError } =
    await getActivePlatformAdminUser({
      supabase,
      userId: user.id,
    });

  if (platformAdminError) {
    throw new Error(
      `Error leyendo administrador de plataforma: ${platformAdminError.message}`
    );
  }

  if (!platformAdmin) {
    notFound();
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    platformRole: platformAdmin.role,
  };
}
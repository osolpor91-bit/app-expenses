import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AdminAuthUser = Pick<
  User,
  "id" | "email" | "created_at" | "last_sign_in_at"
>;

export async function listAllAuthUsers(): Promise<AdminAuthUser[]> {
  const supabaseAdmin = createSupabaseAdminClient();

  const users: AdminAuthUser[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Error leyendo usuarios de Auth: ${error.message}`);
    }

    const currentUsers = data.users.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));

    users.push(...currentUsers);

    if (currentUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function getAuthUserById(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  return supabaseAdmin.auth.admin.getUserById(userId);
}

export function buildAuthUserMap(users: AdminAuthUser[]) {
  return new Map(users.map((user) => [user.id, user]));
}
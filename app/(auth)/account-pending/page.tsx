import { redirect } from "next/navigation";

import { getDictionary } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AccountPendingPage() {
  const supabase = await createSupabaseServerClient();
  const { dict } = await getDictionary();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-app px-4 py-10 text-app">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <div className="card-app w-full p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">
            {dict.accountPending.statusLabel}
          </p>

          <h1 className="mt-3 text-2xl font-bold text-primary-app sm:text-3xl">
            {dict.accountPending.title}
          </h1>

          <p className="mt-4 text-sm leading-6 text-app-muted">
            {dict.accountPending.description}
          </p>

          {user.email && (
            <div className="mt-5 rounded-lg border border-app bg-app-soft px-4 py-3 text-sm text-app-muted">
              <span className="font-medium text-primary-app">
                {dict.accountPending.userLabel}:
              </span>{" "}
              {user.email}
            </div>
          )}

          <p className="mt-5 text-sm leading-6 text-app-muted">
            {dict.accountPending.contactAdmin}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="/logout" className="btn-primary-app px-5 py-2 text-sm">
              {dict.common.logout}
            </a>

            <a href="/login" className="btn-secondary-app px-5 py-2 text-sm">
              {dict.accountPending.backToLogin}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
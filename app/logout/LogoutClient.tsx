"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type LogoutClientProps = {
  loggingOutLabel: string;
};

export default function LogoutClient({ loggingOutLabel }: LogoutClientProps) {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-soft text-app">
      <div className="card-app px-6 py-4">
        <p className="text-sm text-app-muted">{loggingOutLabel}</p>
      </div>
    </main>
  );
}
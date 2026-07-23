import Link from "next/link";

import { getDictionary } from "@/lib/i18n/server";

import PublicWorkGroupsLookup from "./PublicWorkGroupsLookup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicWorkGroupsPage() {
  const { dict } = await getDictionary();

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-app">
      <header className="border-b border-[#e7dfcc] bg-white/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-bold text-primary-app">
            {dict.common.appName}
          </Link>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-secondary-app px-5 py-2 text-sm">
              Acceso Junta
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e7dfcc] bg-[#f2f0e7]">
        <div className="mx-auto max-w-5xl px-5 py-4 sm:px-8 sm:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a2e2e]">
            SUSARROS
          </p>
          <h1 className="mt-1 max-w-3xl text-2xl font-black tracking-tight text-primary-app sm:text-3xl">
            Consulta tus grupos de trabajo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-app-muted">
            Busca tu nombre para ver tus grupos asignados y las personas que
            estarán contigo en cada trabajo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-4 sm:px-8 sm:py-6">
        <div className="rounded-xl border border-[#ded5bd] bg-white p-3 shadow-sm sm:p-4">
          <PublicWorkGroupsLookup initialMessage="Escribe tu nombre y pulsa Ver grupos." />
        </div>
      </section>
    </main>
  );
}

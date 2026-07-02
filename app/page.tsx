import PublicLanguageSwitcher from "@/app/components/PublicLanguageSwitcher";
import { getDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const { locale, dict } = await getDictionary();

  return (
    <main className="min-h-screen bg-app text-app">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold tracking-tight">
              {dict.common.appName}
            </div>

            <div className="mt-1 text-xs text-app-muted">
              {dict.publicHome.tagline}
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            <PublicLanguageSwitcher
              currentLocale={locale}
              label={dict.common.changeLanguage}
            />

            <a href="/login" className="btn-secondary-app px-5 py-2 text-sm">
              {dict.publicHome.login}
            </a>

            <a href="/register" className="btn-primary-app px-5 py-2 text-sm">
              {dict.publicHome.register}
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="badge-app mb-6 px-4 py-2 text-sm font-medium">
              {dict.publicHome.badge}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {dict.publicHome.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-app-muted">
              {dict.publicHome.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="card-app-soft p-5">
                <div className="font-semibold text-primary-app">
                  {dict.publicHome.portalTitle}
                </div>

                <p className="mt-2 text-sm leading-6 text-app-muted">
                  {dict.publicHome.portalDescription}
                </p>
              </div>

              <div className="card-app-soft p-5">
                <div className="font-semibold text-primary-app">
                  {dict.publicHome.invoicingTitle}
                </div>

                <p className="mt-2 text-sm leading-6 text-app-muted">
                  {dict.publicHome.invoicingDescription}
                </p>
              </div>
            </div>
          </section>

          <aside className="card-app-soft rounded-3xl p-6 shadow-xl">
            <div className="card-app p-5">
              <div className="text-sm font-semibold text-primary-app">
                {dict.publicHome.offersTitle}
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <div className="card-app-soft p-4">
                  <div className="font-semibold text-primary-app">
                    {dict.publicHome.secureAccessTitle}
                  </div>

                  <div className="mt-1 text-app-muted">
                    {dict.publicHome.secureAccessDescription}
                  </div>
                </div>

                <div className="card-app-soft p-4">
                  <div className="font-semibold text-primary-app">
                    {dict.publicHome.multiCompanyTitle}
                  </div>

                  <div className="mt-1 text-app-muted">
                    {dict.publicHome.multiCompanyDescription}
                  </div>
                </div>

                <div className="card-app-soft p-4">
                  <div className="font-semibold text-primary-app">
                    {dict.publicHome.activeProductsTitle}
                  </div>

                  <div className="mt-1 text-app-muted">
                    {dict.publicHome.activeProductsDescription}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-primary-app p-5 text-white">
              <div className="text-sm font-bold uppercase tracking-wide">
                {dict.publicHome.inDevelopment}
              </div>

              <p className="mt-2 text-sm leading-6 text-white/85">
                {dict.publicHome.inDevelopmentDescription}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
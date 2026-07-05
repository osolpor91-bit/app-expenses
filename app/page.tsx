import Link from "next/link";

import PublicLanguageSwitcher from "@/app/components/PublicLanguageSwitcher";
import { getDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const { locale, dict } = await getDictionary();
  const labels = dict.publicHome;

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf6] text-app">
      <header className="border-b border-[#e7dfcc] bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <div className="text-xl font-bold tracking-tight text-primary-app">
              {dict.common.appName}
            </div>

            <div className="mt-1 text-xs text-app-muted">
              {labels.tagline}
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <PublicLanguageSwitcher
              currentLocale={locale}
              label={dict.common.changeLanguage}
            />

            <Link
              href="/login"
              className="btn-primary-app px-5 py-2 text-sm"
            >
              {labels.boardAccess}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative border-b border-[#e7dfcc]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(107,127,34,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.10),transparent_34%)]"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-[#cabd98] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7a2e2e]">
              {labels.groupType}
            </p>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-primary-app sm:text-6xl lg:text-7xl">
              {labels.title}
            </h1>

            <p className="mt-3 text-xl font-semibold text-[#6b7f22] sm:text-2xl">
              {labels.subtitle}
            </p>

            <p className="mt-6 max-w-2xl text-base leading-7 text-app-muted sm:text-lg sm:leading-8">
              {labels.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#que-ver"
                className="btn-primary-app px-6 py-2.5 text-sm"
              >
                {labels.seeMore}
              </a>

              <a
                href="#sobre-susarros"
                className="btn-secondary-app bg-white px-6 py-2.5 text-sm"
              >
                {labels.aboutAction}
              </a>
            </div>
          </div>

          <div
            role="img"
            aria-label={labels.photoAriaLabel}
            className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-[#cabe9d] bg-[#3f4f24] p-5 shadow-[0_24px_60px_rgba(63,79,36,0.22)] sm:min-h-[440px] sm:p-7"
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 size-56 rounded-full border-[28px] border-white/5"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-16 size-64 rounded-full border-[34px] border-[#d7c28a]/10"
            />

            <div className="relative flex h-full min-h-[300px] flex-col justify-between rounded-[1.4rem] border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] p-6 text-white sm:min-h-[384px] sm:p-8">
              <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                {labels.photoBadge}
              </span>

              <div className="text-center">
                <div
                  aria-hidden="true"
                  className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-[#d7c28a] text-5xl font-black text-[#ead9a8] sm:size-28"
                >
                  S
                </div>

                <p className="mt-5 text-xl font-bold">
                  {labels.photoPlaceholderTitle}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/75">
                  {labels.photoPlaceholderDescription}
                </p>
              </div>

              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#ead9a8]">
                {labels.astorga}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="que-ver"
        className="mx-auto max-w-7xl scroll-mt-6 px-5 py-14 sm:px-8 sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a2e2e]">
            {labels.publicSpace}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-primary-app sm:text-4xl">
            {labels.whatToSeeTitle}
          </h2>
          <p className="mt-4 leading-7 text-app-muted">
            {labels.whatToSeeDescription}
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <article className="rounded-3xl bg-primary-app p-7 text-white shadow-lg sm:p-8">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ead9a8]">
              {labels.inDevelopment}
            </span>
            <h3 className="mt-5 text-2xl font-bold">
              {labels.developmentTitle}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
              {labels.developmentDescription}
            </p>
          </article>

          <article className="card-app-soft border-[#ded5bd] bg-white p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a2e2e]">
              {labels.comingSoon}
            </p>
            <h3 className="mt-4 text-xl font-bold text-primary-app">
              {labels.activitiesTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {labels.activitiesDescription}
            </p>
          </article>

          <article className="card-app-soft border-[#ded5bd] bg-white p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a2e2e]">
              {labels.comingSoon}
            </p>
            <h3 className="mt-4 text-xl font-bold text-primary-app">
              {labels.newsTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {labels.newsDescription}
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <article className="card-app-soft border-[#ded5bd] bg-white p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a2e2e]">
              {labels.comingSoon}
            </p>
            <h3 className="mt-4 text-xl font-bold text-primary-app">
              {labels.galleryTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {labels.galleryDescription}
            </p>
          </article>

          <article
            id="sobre-susarros"
            className="scroll-mt-6 rounded-3xl border border-[#cabe9d] bg-[#f2f0e7] p-7"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a2e2e]">
              {labels.aboutEyebrow}
            </p>
            <h3 className="mt-4 text-xl font-bold text-primary-app">
              {labels.aboutTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              {labels.aboutDescription}
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-[#e7dfcc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-7 text-sm sm:px-8">
          <p className="font-bold text-primary-app">{labels.footerGroup}</p>
          <p className="text-app-muted">{labels.developedBy}</p>
        </div>
      </footer>
    </main>
  );
}

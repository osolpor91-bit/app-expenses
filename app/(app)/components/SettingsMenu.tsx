"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { setActiveCompanyAction } from "@/app/actions/company";
import { setLocaleAction } from "@/app/actions/locale";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type SettingsMenuCompany = {
  id: string;
  name: string;
  taxId?: string | null;
};

type SettingsMenuLabels = {
  settings: string;
  changeCompany: string;
  currentCompany: string;
  noCompaniesAvailable: string;
  changeLanguage: string;
  currentLanguage: string;
  logout: string;
};

type SettingsMenuProps = {
  currentLocale: Locale;
  companies: SettingsMenuCompany[];
  activeCompanyId: string | null;
  labels: SettingsMenuLabels;
};

export default function SettingsMenu({
  currentLocale,
  companies,
  activeCompanyId,
  labels,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const activeCompany =
    companies.find((company) => company.id === activeCompanyId) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="btn-secondary-app min-w-[116px] px-4 py-2 text-center text-sm"
      >
        {labels.settings} <span aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 min-w-80 rounded-xl border border-app bg-app p-2 shadow-lg">
          <div className="rounded-lg px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              {labels.changeCompany}
            </p>

            <p className="mt-1 text-xs text-app-muted">
              {labels.currentCompany}:{" "}
              {activeCompany?.name ?? labels.noCompaniesAvailable}
            </p>

            <div className="mt-3 space-y-2">
              {companies.length === 0 ? (
                <p className="rounded-lg border border-app bg-app-soft px-3 py-2 text-xs text-app-muted">
                  {labels.noCompaniesAvailable}
                </p>
              ) : (
                companies.map((company) => (
                  <form key={company.id} action={setActiveCompanyAction}>
                    <input type="hidden" name="companyId" value={company.id} />
                    <input type="hidden" name="redirectTo" value={pathname} />

                    <button
                      type="submit"
                      disabled={company.id === activeCompanyId}
                      className="btn-secondary-app w-full px-3 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="block font-semibold">
                        {company.name}
                      </span>

                      {company.taxId && (
                        <span className="mt-0.5 block text-[11px] text-app-muted">
                          {company.taxId}
                        </span>
                      )}
                    </button>
                  </form>
                ))
              )}
            </div>
          </div>

          <div className="my-2 border-t border-app" />

          <div className="rounded-lg px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              {labels.changeLanguage}
            </p>

            <p className="mt-1 text-xs text-app-muted">
              {labels.currentLanguage}: {localeLabels[currentLocale]}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {locales.map((locale) => (
                <form key={locale} action={setLocaleAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={pathname} />

                  <button
                    type="submit"
                    disabled={locale === currentLocale}
                    className="btn-secondary-app w-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {localeLabels[locale]}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="my-2 border-t border-app" />

          <a
            href="/logout"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-app-muted hover:bg-app-soft hover:text-primary-app"
          >
            {labels.logout}
          </a>
        </div>
      )}
    </div>
  );
}
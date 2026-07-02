"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { setLocaleAction } from "@/app/actions/locale";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type PublicLanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

export default function PublicLanguageSwitcher({
  currentLocale,
  label,
}: PublicLanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
        className="btn-secondary-app min-w-[140px] px-5 py-2 text-sm"
      >
        {label} <span aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 min-w-48 rounded-xl border border-app bg-app p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            {locales.map((locale) => (
              <form key={locale} action={setLocaleAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="redirectTo" value={pathname} />

                <button
                  type="submit"
                  disabled={locale === currentLocale}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-app-muted transition hover:bg-app-soft hover:text-primary-app disabled:cursor-not-allowed disabled:bg-app-soft disabled:text-primary-app"
                >
                  {localeLabels[locale]}
                  {locale === currentLocale ? " ✓" : ""}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
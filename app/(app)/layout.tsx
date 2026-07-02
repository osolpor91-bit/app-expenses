import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";

import AppNav from "./components/AppNav";
import SettingsMenu from "./components/SettingsMenu";

export default async function PrivateAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, companies, activeCompany, role } =
    await requireCompanyContext();

  const { locale, dict } = await getDictionary();

  return (
    <div className="min-h-screen bg-app">
      <header className="sticky top-0 z-[100] bg-app/95 backdrop-blur">
        <div className="shell-app flex min-h-14 items-center justify-between gap-6">
          <AppNav
            role={role}
            labels={{
              menu: dict.nav.menu,
              configurations: dict.nav.configurations,
              admin: dict.admin.menu,
              adminTenants: dict.admin.tenants,
              adminTenantUsers: dict.admin.tenantUsers,
              adminUsersWithoutTenant: dict.admin.usersWithoutTenant,
            }}
          />

          <div className="flex items-center gap-4">
            <div className="text-right">
              <a
                href="/dashboard"
                className="text-base font-bold text-primary-app"
              >
                {dict.common.appName}
              </a>

              <p className="mt-0.5 text-xs text-app-muted">
                {dict.common.activeCompany}:{" "}
                <span className="text-sm font-bold text-[#6b7f22]">
                  {activeCompany?.name ?? dict.common.noActiveCompany}
                </span>
                {user.email ? ` · ${user.email}` : ""}
              </p>
            </div>

            <SettingsMenu
              currentLocale={locale}
              companies={companies.map((company) => ({
                id: company.id,
                name: company.name,
                taxId: company.tax_id ?? null,
              }))}
              activeCompanyId={activeCompany?.id ?? null}
              labels={{
                settings: dict.common.settings,
                changeCompany: dict.common.changeCompany,
                currentCompany: dict.common.currentCompany,
                noCompaniesAvailable: dict.common.noCompaniesAvailable,
                changeLanguage: dict.common.changeLanguage,
                currentLanguage: dict.common.currentLanguage,
                logout: dict.common.logout,
              }}
            />
          </div>
        </div>
      </header>

      <main className="shell-app py-0">{children}</main>
    </div>
  );
}

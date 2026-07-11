import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";

type ConfigurationLink =
  | {
      type?: "link";
      href: string;
      label: string;
    }
  | {
      type: "label";
      label: string;
    };

type ConfigurationGroup = {
  title: string;
  links: ConfigurationLink[];
};

function ConfigurationGroupCard({ group }: { group: ConfigurationGroup }) {
  return (
    <section className="card-app-soft p-5">
      <h2 className="text-lg font-semibold text-primary-app">{group.title}</h2>

      {group.links.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {group.links.map((link) => (
            <li key={link.label}>
              {link.type === "label" ? (
                <div className="px-2 pb-1 pt-3 text-base font-bold text-primary-app">
                  {link.label}
                </div>
              ) : (
                <Link
                  href={link.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-app-muted transition hover:bg-app hover:text-primary-app"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-app-muted"
                  />

                  <span>{link.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ConfigurationsPage() {
  await requireCompanyContext();
  const { dict } = await getDictionary();

  const generalLinks: ConfigurationLink[] = [
    {
      href: "/companies",
      label: dict.nav.companies,
    },
    {
      href: "/countries",
      label: dict.nav.countries,
    },
    {
      href: "/field-visibility-preferences",
      label: dict.fieldVisibilityPreferences.title,
    },
  ];

  generalLinks.push({
    href: "/email-configurations",
    label: dict.emailConfigurations.title,
  });

  generalLinks.push({
    href: "/chart-of-accounts",
    label: dict.chartOfAccounts.title,
  });

  generalLinks.push({
    href: "/payment-channels",
    label: dict.paymentChannels.title,
  });

  generalLinks.push({
    href: "/tax-areas",
    label: dict.taxAreas.title,
  });

  generalLinks.push({
    href: "/fiscal-treatments",
    label: dict.fiscalTreatments.title,
  });
  
  generalLinks.push({
    href: "/tax-configurations",
    label: dict.taxConfigurations.title,
  });


  const purchasingLinks: ConfigurationLink[] = [
    {
      href: "/items",
      label: dict.items.title,
    },
    {
      href: "/suppliers",
      label: dict.nav.suppliers,
    },
    {
      href: "/purchase-invoices",
      label: dict.purchaseInvoices.title,
    },
    {
      href: "/portal-supplier-invoices",
      label: dict.portalSupplierInvoices.title,
    },
  ];

  const susarrosLinks: ConfigurationLink[] = [
    {
      href: "/treasury-general",
      label: dict.treasuryGeneral.title,
    },
    {
      href: "/treasury-members",
      label: dict.treasuryMembers.title,
    },
    {
      href: "/reports",
      label: dict.reports.title,
    },
    {
      type: "label",
      label: "Grupos y asistencia",
    },
    {
      href: "/work-groups",
      label: dict.workGroups.title,
    },
    {
      href: "/work-group-report",
      label: dict.workGroups.reportTitle,
    },
    {
      href: "/attendance-register",
      label: dict.attendance.title,
    },
    {
      href: "/attendance-report",
      label: dict.attendance.reportTitle,
    },
  ];

  const groups: ConfigurationGroup[] = [
    {
      title: dict.configurations.groups.general.title,
      links: generalLinks,
    },
    {
      title: dict.configurations.groups.purchasing.title,
      links: purchasingLinks,
    },
    {
      title: "SUSARROS",
      links: susarrosLinks,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {dict.configurations.title}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <ConfigurationGroupCard key={group.title} group={group} />
        ))}
      </div>
    </section>
  );
}

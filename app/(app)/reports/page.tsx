import Link from "next/link";

import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { getDictionary } from "@/lib/i18n/server";

type ReportLink = {
  href: string;
  title: string;
};

function ReportLinkCard({ report }: { report: ReportLink }) {
  return (
    <Link
      href={report.href}
      className="card-app-soft flex h-24 w-full items-end p-5 transition hover:-translate-y-0.5 hover:bg-app sm:w-64"
    >
      <h2 className="text-xl font-bold text-primary-app">
        {report.title}
      </h2>
    </Link>
  );
}

export default async function ReportsPage() {
  await requireCompanyContext();
  const { dict } = await getDictionary();

  const reports: ReportLink[] = [
    {
      href: "/treasury-general/balance",
      title: dict.reports.treasuryBalance,
    },
    {
      href: "/treasury-general/detailed-balance",
      title: dict.reports.treasuryDetailedBalance,
    },
    {
      href: "/reports/income-distribution",
      title: dict.reports.incomeDistribution,
    },
    {
      href: "/reports/expense-distribution",
      title: dict.reports.expenseDistribution,
    },
    {
      href: "/reports/inventory-by-product",
      title: dict.reports.inventoryByProduct,
    },
    {
      href: "/reports/inventory-by-warehouse",
      title: dict.reports.inventoryByWarehouse,
    },
    {
      href: "/attendance-report",
      title: dict.attendance.reportTitle,
    },
    {
      href: "/work-group-report",
      title: dict.workGroups.reportTitle,
    },
  ];

  return (
    <section className="max-w-4xl space-y-6">
      <div className="space-y-1">
        <Link href="/configurations" className="link-app inline-block text-sm">
          {"<-"} {dict.reports.backToConfigurations}
        </Link>

        <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
          {dict.reports.title}
        </h1>
      </div>

      <div className="flex flex-wrap gap-4">
        {reports.map((report) => (
          <ReportLinkCard key={report.href} report={report} />
        ))}
      </div>
    </section>
  );
}

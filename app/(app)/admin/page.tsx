import Link from "next/link";

import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { getDictionary } from "@/lib/i18n/server";

export default async function AdminPage() {
  await requirePlatformAdmin();

  const { dict } = await getDictionary();

  const links = [
    { href: "/admin/products", label: dict.admin.products },
    { href: "/admin/plans", label: dict.admin.plans },
    { href: "/admin/plan-products", label: dict.admin.planProducts },
    { href: "/admin/subscriptions", label: dict.admin.subscriptions },
    { href: "/admin/tenant-products", label: dict.admin.tenantProducts },
    { href: "/admin/tenant-users", label: dict.admin.tenantUsers },
  ];

  return (
    <section>
      <h1 className="text-2xl font-bold text-primary-app sm:text-3xl">
        {dict.admin.title}
      </h1>

      <p className="mt-2 text-sm text-app-muted">{dict.admin.description}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card-app-soft p-5 transition hover:-translate-y-0.5 hover:bg-app"
          >
            <h2 className="text-base font-semibold text-primary-app">
              {link.label}
            </h2>

            <p className="mt-3 text-sm text-app-muted">
              {dict.admin.comingSoonDescription}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { portalSupplierInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type PortalSupplierInvoicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PortalSupplierInvoicesPage({
  searchParams,
}: PortalSupplierInvoicesPageProps) {
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "portal");

  return (
    <EntityListDetailPage
      entity={portalSupplierInvoiceEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[860px]"
    />
  );
}
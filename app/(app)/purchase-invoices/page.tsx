export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { purchaseInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type PurchaseInvoicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PurchaseInvoicesPage({
  searchParams,
}: PurchaseInvoicesPageProps) {
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "portal");

  return (
    <EntityListDetailPage
      entity={purchaseInvoiceEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[860px]"
    />
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { purchaseInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type PurchaseInvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PurchaseInvoiceDetailPage({
  params,
}: PurchaseInvoiceDetailPageProps) {
  const { id } = await params;
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "portal");

  return <EntityEditPage entity={purchaseInvoiceEntity} id={id} />;
}
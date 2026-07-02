export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return <EntityEditPage entity={purchaseInvoiceEntity} id={id} />;
}

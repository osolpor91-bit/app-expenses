export const dynamic = "force-dynamic";
export const revalidate = 0;

import { portalSupplierInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type PortalSupplierInvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortalSupplierInvoiceDetailPage({
  params,
}: PortalSupplierInvoiceDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={portalSupplierInvoiceEntity} id={id} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
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
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "portal");

  return <EntityEditPage entity={portalSupplierInvoiceEntity} id={id} />;
}
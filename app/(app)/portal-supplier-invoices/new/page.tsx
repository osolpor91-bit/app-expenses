export const dynamic = "force-dynamic";
export const revalidate = 0;

import { portalSupplierInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewPortalSupplierInvoicePage() {
  return <EntityCreatePage entity={portalSupplierInvoiceEntity} />;
}

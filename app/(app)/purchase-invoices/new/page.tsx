export const dynamic = "force-dynamic";
export const revalidate = 0;

import { purchaseInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewPurchaseInvoicePage() {
  return <EntityCreatePage entity={purchaseInvoiceEntity} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { purchaseInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewPurchaseInvoicePage() {
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "portal");

  return <EntityCreatePage entity={purchaseInvoiceEntity} />;
}
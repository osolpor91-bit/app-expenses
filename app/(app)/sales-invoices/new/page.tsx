export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { salesInvoiceEntity } from "@/lib/entities/salesInvoices/salesInvoiceEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewSalesInvoicePage() {
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "invoicing");

  return <EntityCreatePage entity={salesInvoiceEntity} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireProduct } from "@/lib/billing/requireProduct";
import { requireCompanyContext } from "@/lib/company/requireCompanyContext";
import { salesInvoiceEntity } from "@/lib/entities/salesInvoices/salesInvoiceEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type SalesInvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SalesInvoiceDetailPage({
  params,
}: SalesInvoiceDetailPageProps) {
  const { id } = await params;
  const { supabase, tenant } = await requireCompanyContext();

  await requireProduct(supabase, tenant.id, "invoicing");

  return <EntityEditPage entity={salesInvoiceEntity} id={id} />;
}
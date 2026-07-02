export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return <EntityEditPage entity={salesInvoiceEntity} id={id} />;
}

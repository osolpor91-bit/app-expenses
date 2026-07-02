export const dynamic = "force-dynamic";
export const revalidate = 0;

import { salesInvoiceEntity } from "@/lib/entities/salesInvoices/salesInvoiceEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewSalesInvoicePage() {
  return <EntityCreatePage entity={salesInvoiceEntity} />;
}

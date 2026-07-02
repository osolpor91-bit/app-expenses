export const dynamic = "force-dynamic";
export const revalidate = 0;

import { salesInvoiceEntity } from "@/lib/entities/salesInvoices/salesInvoiceEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type SalesInvoicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalesInvoicesPage({
  searchParams,
}: SalesInvoicesPageProps) {
  return (
    <EntityListDetailPage
      entity={salesInvoiceEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[860px]"
    />
  );
}

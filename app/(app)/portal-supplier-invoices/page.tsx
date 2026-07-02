export const dynamic = "force-dynamic";
export const revalidate = 0;

import { portalSupplierInvoiceEntity } from "@/lib/entities/portalSupplierInvoices/portalSupplierInvoiceEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type PortalSupplierInvoicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PortalSupplierInvoicesPage({
  searchParams,
}: PortalSupplierInvoicesPageProps) {
  return (
    <EntityListDetailPage
      entity={portalSupplierInvoiceEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[860px]"
    />
  );
}

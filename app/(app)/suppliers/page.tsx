export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supplierEntity } from "@/lib/entities/suppliers/supplierEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type SuppliersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuppliersPage({
  searchParams,
}: SuppliersPageProps) {
  return (
    <EntityListDetailPage
      entity={supplierEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[1020px]"
    />
  );
}
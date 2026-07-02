export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supplierEntity } from "@/lib/entities/suppliers/supplierEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type SupplierDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={supplierEntity} id={id} />;
}
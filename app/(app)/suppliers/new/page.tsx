export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supplierEntity } from "@/lib/entities/suppliers/supplierEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default function NewSupplierPage() {
  return <EntityCreatePage entity={supplierEntity} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { companyEntity } from "@/lib/entities/companies/companyEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default function NewCompanyPage() {
  return <EntityCreatePage entity={companyEntity} />;
}
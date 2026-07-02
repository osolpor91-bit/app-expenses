export const dynamic = "force-dynamic";
export const revalidate = 0;

import { companyEntity } from "@/lib/entities/companies/companyEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type CompanyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={companyEntity} id={id} />;
}
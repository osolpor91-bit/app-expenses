export const dynamic = "force-dynamic";
export const revalidate = 0;

import { companyEntity } from "@/lib/entities/companies/companyEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type CompaniesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  return (
    <EntityListDetailPage
      entity={companyEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[1020px]"
    />
  );
}
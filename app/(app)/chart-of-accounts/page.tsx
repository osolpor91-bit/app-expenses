export const dynamic = "force-dynamic";
export const revalidate = 0;

import { chartOfAccountEntity } from "@/lib/entities/chartOfAccounts/chartOfAccountEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type ChartOfAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChartOfAccountsPage({
  searchParams,
}: ChartOfAccountsPageProps) {
  return (
    <EntityListDetailPage
      entity={chartOfAccountEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[1180px]"
    />
  );
}
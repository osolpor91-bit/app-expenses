export const dynamic = "force-dynamic";
export const revalidate = 0;

import { chartOfAccountEntity } from "@/lib/entities/chartOfAccounts/chartOfAccountEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type ChartOfAccountDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChartOfAccountDetailPage({
  params,
}: ChartOfAccountDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={chartOfAccountEntity} id={id} />;
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { chartOfAccountEntity } from "@/lib/entities/chartOfAccounts/chartOfAccountEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default function NewChartOfAccountPage() {
  return <EntityCreatePage entity={chartOfAccountEntity} />;
}
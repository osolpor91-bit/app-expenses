export const dynamic = "force-dynamic";
export const revalidate = 0;

import { treasuryGeneralEntity } from "@/lib/entities/treasuryGeneral/treasuryGeneralEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";
import { loadTreasuryMovementOptions } from "./treasuryMovementOptions";

type TreasuryGeneralPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TreasuryGeneralPage({
  searchParams,
}: TreasuryGeneralPageProps) {
  const { accountOptions, memberOptions, defaultMemberId } =
    await loadTreasuryMovementOptions();

  return (
    <EntityListDetailPage
      entity={treasuryGeneralEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[520px]"
      treasuryAccountOptions={accountOptions}
      treasuryMemberOptions={memberOptions}
      defaultTreasuryMemberId={defaultMemberId}
    />
  );
}

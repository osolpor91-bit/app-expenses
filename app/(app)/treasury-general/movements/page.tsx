export const dynamic = "force-dynamic";
export const revalidate = 0;

import { treasuryGeneralMovementEntity } from "@/lib/entities/treasuryGeneralMovements/treasuryGeneralMovementEntity";
import { getDictionary } from "@/lib/i18n/server";

import EntityListDetailPage from "../../components/entityPages/EntityListDetailPage";
import { loadTreasuryMovementOptions } from "../treasuryMovementOptions";

type TreasuryGeneralMovementsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TreasuryGeneralMovementsPage({
  searchParams,
}: TreasuryGeneralMovementsPageProps) {
  const [{ accountOptions, memberOptions, defaultMemberId }, { dict }] =
    await Promise.all([loadTreasuryMovementOptions(), getDictionary()]);

  return (
    <EntityListDetailPage
      entity={treasuryGeneralMovementEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[880px]"
      treasuryAccountOptions={accountOptions}
      treasuryMemberOptions={memberOptions}
      defaultTreasuryMemberId={defaultMemberId}
      backHref="/treasury-general"
      backLabel={dict.treasuryGeneralMovements.backToTreasuryGeneral}
      initiallyShowSecondaryFilters={false}
    />
  );
}

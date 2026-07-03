export const dynamic = "force-dynamic";
export const revalidate = 0;

import { treasuryMemberEntity } from "@/lib/entities/treasuryMembers/treasuryMemberEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type TreasuryMembersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function TreasuryMembersPage({
  searchParams,
}: TreasuryMembersPageProps) {
  return (
    <EntityEditableGridPage
      entity={treasuryMemberEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[680px]"
    />
  );
}

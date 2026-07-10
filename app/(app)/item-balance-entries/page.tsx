export const dynamic = "force-dynamic";
export const revalidate = 0;

import { itemBalanceEntryEntity } from "@/lib/entities/itemBalanceEntries/itemBalanceEntryEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type ItemBalanceEntriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemBalanceEntriesPage({
  searchParams,
}: ItemBalanceEntriesPageProps) {
  return (
    <EntityListDetailPage
      entity={itemBalanceEntryEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[760px]"
      initiallyShowSecondaryFilters={false}
    />
  );
}

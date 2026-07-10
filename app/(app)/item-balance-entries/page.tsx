export const dynamic = "force-dynamic";
export const revalidate = 0;

import { itemBalanceEntryEntity } from "@/lib/entities/itemBalanceEntries/itemBalanceEntryEntity";
import { getDictionary } from "@/lib/i18n/server";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type ItemBalanceEntriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemBalanceEntriesPage({
  searchParams,
}: ItemBalanceEntriesPageProps) {
  const { dict } = await getDictionary();

  return (
    <EntityListDetailPage
      entity={itemBalanceEntryEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[760px]"
      backHref="/items"
      backLabel={dict.items.backToList}
      initiallyShowSecondaryFilters={false}
    />
  );
}

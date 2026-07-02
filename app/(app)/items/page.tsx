export const dynamic = "force-dynamic";
export const revalidate = 0;

import { itemEntity } from "@/lib/entities/items/itemEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type ItemsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  return (
    <EntityListDetailPage
      entity={itemEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[920px]"
    />
  );
}
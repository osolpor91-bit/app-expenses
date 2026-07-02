export const dynamic = "force-dynamic";
export const revalidate = 0;

import { itemEntity } from "@/lib/entities/items/itemEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type ItemDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={itemEntity} id={id} />;
}
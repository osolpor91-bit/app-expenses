export const dynamic = "force-dynamic";
export const revalidate = 0;

import { itemEntity } from "@/lib/entities/items/itemEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default async function NewItemPage() {
  return <EntityCreatePage entity={itemEntity} />;
}
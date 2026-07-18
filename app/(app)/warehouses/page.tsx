export const dynamic = "force-dynamic";
export const revalidate = 0;

import { warehouseEntity } from "@/lib/entities/warehouses/warehouseEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type WarehousesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WarehousesPage({
  searchParams,
}: WarehousesPageProps) {
  return (
    <EntityEditableGridPage
      entity={warehouseEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[640px]"
    />
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { taxAreaEntity } from "@/lib/entities/taxAreas/taxAreaEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type TaxAreasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaxAreasPage({ searchParams }: TaxAreasPageProps) {
  return (
    <EntityEditableGridPage
      entity={taxAreaEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[760px]"
    />
  );
}
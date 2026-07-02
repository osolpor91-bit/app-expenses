export const dynamic = "force-dynamic";
export const revalidate = 0;

import { taxConfigurationEntity } from "@/lib/entities/taxConfigurations/taxConfigurationEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type TaxConfigurationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaxConfigurationsPage({
  searchParams,
}: TaxConfigurationsPageProps) {
  return (
    <EntityEditableGridPage
      entity={taxConfigurationEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[1500px]"
    />
  );
}
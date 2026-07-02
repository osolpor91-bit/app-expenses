export const dynamic = "force-dynamic";
export const revalidate = 0;

import { countryEntity } from "@/lib/entities/countries/countryEntity";
import { getDictionary } from "@/lib/i18n/server";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";
import FillEuCountriesButton from "./FillEuCountriesButton";

type CountriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CountriesPage({
  searchParams,
}: CountriesPageProps) {
  const { locale, dict } = await getDictionary();

  return (
    <EntityEditableGridPage
      entity={countryEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[620px]"
      viewActions={
        <FillEuCountriesButton
          locale={locale}
          variant="menuItem"
          labels={{
            fill: dict.countries.fillEuCountries,
            filling: dict.countries.fillingEuCountries,
          }}
        />
      }
    />
  );
}
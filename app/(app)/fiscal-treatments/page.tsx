export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fiscalTreatmentEntity } from "@/lib/entities/fiscalTreatments/fiscalTreatmentEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type FiscalTreatmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FiscalTreatmentsPage({
  searchParams,
}: FiscalTreatmentsPageProps) {
  return (
    <EntityEditableGridPage
      entity={fiscalTreatmentEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[760px]"
    />
  );
}
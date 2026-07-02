export const dynamic = "force-dynamic";
export const revalidate = 0;

import { emailConfigurationEntity } from "@/lib/entities/emailConfigurations/emailConfigurationEntity";

import EntityListDetailPage from "../components/entityPages/EntityListDetailPage";

type EmailConfigurationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmailConfigurationsPage({
  searchParams,
}: EmailConfigurationsPageProps) {
  return (
    <EntityListDetailPage
      entity={emailConfigurationEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[640px]"
    />
  );
}
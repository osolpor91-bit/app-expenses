export const dynamic = "force-dynamic";
export const revalidate = 0;

import { emailConfigurationEntity } from "@/lib/entities/emailConfigurations/emailConfigurationEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type EmailConfigurationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EmailConfigurationDetailPage({
  params,
}: EmailConfigurationDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={emailConfigurationEntity} id={id} />;
}
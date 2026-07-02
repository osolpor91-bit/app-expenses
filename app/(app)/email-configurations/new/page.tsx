export const dynamic = "force-dynamic";
export const revalidate = 0;

import { emailConfigurationEntity } from "@/lib/entities/emailConfigurations/emailConfigurationEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default function NewEmailConfigurationPage() {
  return <EntityCreatePage entity={emailConfigurationEntity} />;
}
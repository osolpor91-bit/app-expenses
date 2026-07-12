export const dynamic = "force-dynamic";
export const revalidate = 0;

import { workGroupEntity } from "@/lib/entities/workGroups/workGroupEntity";

import EntityCreatePage from "../../components/entityPages/EntityCreatePage";

export default function NewWorkGroupPage() {
  return <EntityCreatePage entity={workGroupEntity} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { workGroupEntity } from "@/lib/entities/workGroups/workGroupEntity";

import EntityEditPage from "../../components/entityPages/EntityEditPage";

type WorkGroupDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkGroupDetailPage({
  params,
}: WorkGroupDetailPageProps) {
  const { id } = await params;

  return <EntityEditPage entity={workGroupEntity} id={id} />;
}

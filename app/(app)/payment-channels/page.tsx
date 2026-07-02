export const dynamic = "force-dynamic";
export const revalidate = 0;

import { paymentChannelEntity } from "@/lib/entities/paymentChannels/paymentChannelEntity";

import EntityEditableGridPage from "../components/entityPages/EntityEditableGridPage";

type PaymentChannelsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentChannelsPage({
  searchParams,
}: PaymentChannelsPageProps) {
  return (
    <EntityEditableGridPage
      entity={paymentChannelEntity}
      searchParams={searchParams}
      minWidthClass="min-w-[760px]"
    />
  );
}
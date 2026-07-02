import { getDictionary } from "@/lib/i18n/server";

import LogoutClient from "./LogoutClient";

export default async function LogoutPage() {
  const { dict } = await getDictionary();

  return <LogoutClient loggingOutLabel={dict.logout.loggingOut} />;
}
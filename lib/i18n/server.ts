import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "./config";
import { getDictionaryByLocale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();

  return {
    locale,
    dict: getDictionaryByLocale(locale),
  };
}
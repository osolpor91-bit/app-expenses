"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n/config";

function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function setLocaleAction(formData: FormData) {
  const rawLocale = formData.get("locale");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  const locale: Locale =
    typeof rawLocale === "string" && isLocale(rawLocale)
      ? rawLocale
      : defaultLocale;

  const cookieStore = await cookies();

  cookieStore.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(redirectTo);
}
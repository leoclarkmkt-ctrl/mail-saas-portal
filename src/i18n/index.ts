import { cookies } from "next/headers";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";

export type Locale = "en" | "zh";

export const dictionaries = { en, zh };

export function getLocale(): Locale {
  const cookieLocale = cookies().get("portal-lang")?.value as Locale | undefined;
  if (cookieLocale === "zh" || cookieLocale === "en") {
    return cookieLocale;
  }
  return "en";
}

export function getDictionary(locale?: Locale) {
  return dictionaries[locale ?? getLocale()];
}

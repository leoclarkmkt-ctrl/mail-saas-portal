import "server-only";

import { cookies } from "next/headers";
import type { Locale } from "@/i18n";
import { eduMailDictionaries } from "@/i18n/edu-mail";
import { getLangFromSearchParams, normalizeLocale, type SearchParams } from "@/lib/i18n/shared";

export function getLocaleFromCookies(defaultLocale: Locale = "en"): Locale {
  const value =
    cookies().get("lang")?.value ??
    cookies().get("portal-lang")?.value;
  return normalizeLocale(value) ?? defaultLocale;
}

export function getDictionary(locale: Locale) {
  const dict = eduMailDictionaries[locale];
  return typeof dict === "function" ? dict() : dict;
}

export function getLangFromRequest(
  searchParams?: SearchParams,
  defaultLocale: Locale = "en"
): Locale {
  const fromQuery = getLangFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;
  return getLocaleFromCookies(defaultLocale);
}

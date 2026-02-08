import "server-only";

import { cookies } from "next/headers";
import type { Locale } from "@/i18n";
import { eduMailDictionaries } from "@/i18n/edu-mail";
import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import {
  getLangFromSearchParams,
  normalizeLocale,
  type SearchParams
} from "@/lib/i18n/shared";

/**
 * Read locale from cookies (server-only).
 * Priority:
 * 1) lang
 * 2) portal-lang
 * 3) defaultLocale
 */
export function getLocaleFromCookies(
  defaultLocale: Locale = "en"
): Locale {
  const value =
    cookies().get("lang")?.value ??
    cookies().get("portal-lang")?.value;

  return normalizeLocale(value) ?? defaultLocale;
}

/**
 * Edu-mail dictionaries
 * Used by /edu-mail/*
 */
export function getDictionary(locale: Locale) {
  return eduMailDictionaries[locale];
}

/**
 * Portal dictionaries
 * Used by layout / admin / dashboard / public pages
 */
const portalDictionaries: Record<Locale, any> = {
  en,
  zh
};

export function getPortalDictionary(locale: Locale) {
  return portalDictionaries[locale];
}

/**
 * Resolve locale from request:
 * 1) searchParams (?lang=)
 * 2) cookies
 * 3) defaultLocale
 */
export function getLangFromRequest(
  searchParams?: SearchParams,
  defaultLocale: Locale = "en"
): Locale {
  const fromQuery = getLangFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;
  return getLocaleFromCookies(defaultLocale);
}

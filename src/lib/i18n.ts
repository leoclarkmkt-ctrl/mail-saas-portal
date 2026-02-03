import { cookies } from "next/headers";
import { dictionaries } from "@/i18n";
import type { Locale } from "@/i18n";

type SearchParams = Record<string, string | string[] | undefined> | URLSearchParams | null | undefined;

const normalizeLang = (value: string | undefined): Locale | undefined => {
  if (value === "en" || value === "zh") return value;
  return undefined;
};

export function getLangFromSearchParams(searchParams?: SearchParams): Locale | undefined {
  if (!searchParams) return undefined;
  if (searchParams instanceof URLSearchParams) {
    return normalizeLang(searchParams.get("lang") ?? undefined);
  }
  const value = searchParams.lang;
  if (Array.isArray(value)) {
    return normalizeLang(value[0]);
  }
  return normalizeLang(value);
}

export function getLangFromRequest(searchParams?: SearchParams): Locale {
  const fromQuery = getLangFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;
  const cookieLocale = cookies().get("portal-lang")?.value;
  return normalizeLang(cookieLocale) ?? "en";
}

export function withLang(path: string, lang?: Locale) {
  if (!lang) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}`;
}

export function t(key: string, locale: Locale): string {
  const dict = dictionaries[locale];
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict as Record<string, unknown>);
  return typeof value === "string" ? value : key;
}

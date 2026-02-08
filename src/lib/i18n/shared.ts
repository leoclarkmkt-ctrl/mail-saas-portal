import type { Locale } from "@/i18n";

export type SearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | null
  | undefined;

export const normalizeLocale = (value: string | undefined): Locale | undefined => {
  if (value === "en" || value === "zh") return value;
  return undefined;
};

export function getLangFromSearchParams(searchParams?: SearchParams): Locale | undefined {
  if (!searchParams) return undefined;
  if (searchParams instanceof URLSearchParams) {
    return normalizeLocale(searchParams.get("lang") ?? undefined);
  }
  const value = searchParams.lang;
  if (Array.isArray(value)) {
    return normalizeLocale(value[0]);
  }
  return normalizeLocale(value);
}

export function withLang(path: string, lang?: Locale) {
  if (!lang) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}`;
}

import { cookies } from "next/headers";
import type { EduMailLang } from "@/i18n/edu-mail";

export type EduMailSearchParams = Record<string, string | string[] | undefined> | URLSearchParams | null | undefined;

const normalizeLang = (value: string | undefined): EduMailLang | undefined => {
  if (value === "en" || value === "zh") return value;
  return undefined;
};

export function getEduMailLangFromSearchParams(searchParams?: EduMailSearchParams): EduMailLang | undefined {
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

export function getEduMailLang(searchParams?: EduMailSearchParams): EduMailLang {
  const fromQuery = getEduMailLangFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;
  const cookieLocale = cookies().get("edu_lang")?.value;
  return normalizeLang(cookieLocale) ?? "en";
}

export function withEduLang(path: string, lang?: EduMailLang) {
  if (!lang) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}`;
}

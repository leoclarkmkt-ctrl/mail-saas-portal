import { en } from "@/i18n/en";
import { zh } from "@/i18n/zh";
import type { Locale } from "@/i18n";

const dictionaries = { en, zh };

export function getDictionary(locale: Locale) {
  const dict = dictionaries[locale];
  return typeof dict === "function" ? dict() : dict;
}

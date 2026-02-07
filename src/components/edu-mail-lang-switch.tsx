"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { EduMailLang } from "@/i18n/edu-mail";

const COOKIE_NAME = "edu_lang";

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const resolveNavigatorLang = () => {
  if (typeof navigator === "undefined") return "en" as EduMailLang;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
};

export function EduMailLangSwitch({
  currentLang,
  labels
}: {
  currentLang: EduMailLang;
  labels: { zh: string; en: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextLang = useMemo(() => (currentLang === "zh" ? "en" : "zh"), [currentLang]);

  useEffect(() => {
    const existing = getCookieValue(COOKIE_NAME);
    if (!existing) {
      const resolved = resolveNavigatorLang();
      document.cookie = `${COOKIE_NAME}=${resolved}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  const handleSwitch = () => {
    document.cookie = `${COOKIE_NAME}=${nextLang}; path=/; max-age=31536000; samesite=lax`;
    const params = new URLSearchParams(searchParams?.toString());
    params.set("lang", nextLang);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-accent text-accent hover:bg-accent/10"
      onClick={handleSwitch}
    >
      {currentLang === "zh" ? labels.en : labels.zh}
    </Button>
  );
}

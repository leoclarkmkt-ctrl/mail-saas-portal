"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitch({
  currentLang,
  labels
}: {
  currentLang: "en" | "zh";
  labels: {
    switchToEn: string;
    switchToZh: string;
  };
}) {
  const pathname = usePathname();
  const next = currentLang === "zh" ? "en" : "zh";
  const nextLabel = currentLang === "zh" ? labels.switchToEn : labels.switchToZh;

  const buildNextUrl = () => {
    if (typeof window === "undefined") return pathname;
    const params = new URLSearchParams(window.location.search);
    params.set("lang", next);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        document.cookie = `nsuk_lang=${next}; path=/; max-age=31536000; samesite=lax`;
        document.cookie = `portal-lang=${next}; path=/; max-age=31536000; samesite=lax`;
        const nextUrl = buildNextUrl();
        window.location.href = nextUrl;
      }}
    >
      {nextLabel}
    </Button>
  );
}

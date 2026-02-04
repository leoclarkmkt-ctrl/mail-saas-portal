"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitch({ currentLang }: { currentLang: "en" | "zh" }) {
  const pathname = usePathname();
  const router = useRouter();
  const next = currentLang === "zh" ? "en" : "zh";
  const nextLabel = currentLang === "zh" ? "English" : "中文";

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
        document.cookie = `portal-lang=${next}; path=/; max-age=31536000; samesite=lax`;
        router.push(buildNextUrl());
      }}
    >
      {nextLabel}
    </Button>
  );
}

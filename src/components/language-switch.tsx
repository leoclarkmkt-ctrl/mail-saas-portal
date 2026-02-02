"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const cookieLang = typeof document === "undefined"
    ? null
    : document.cookie
        .split("; ")
        .find((row) => row.startsWith("portal-lang="))
        ?.split("=")[1];
  const current = params.get("lang") ?? cookieLang ?? "en";
  const next = current === "zh" ? "en" : "zh";
  const nextLabel = current === "zh" ? "English" : "中文";

  const nextParams = new URLSearchParams(params.toString());
  nextParams.set("lang", next);
  const url = `${pathname}?${nextParams.toString()}`;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        document.cookie = `portal-lang=${next}; path=/; max-age=31536000; samesite=lax`;
        router.push(url);
        router.refresh();
      }}
    >
      {nextLabel}
    </Button>
  );
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("lang");
  const next = current === "zh" ? "en" : "zh";
  const nextLabel = current === "zh" ? "English" : "中文";

  const url = `${pathname}?lang=${next}`;

  return (
    <Button variant="ghost" size="sm" onClick={() => (window.location.href = url)}>
      {nextLabel}
    </Button>
  );
}

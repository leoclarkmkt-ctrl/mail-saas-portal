"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getLangFromSearchParams } from "@/lib/i18n/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetForm } from "@/components/reset-form";

export default function ResetPage() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams) ?? "en";
  const dict = useMemo(() => getDictionary(lang), [lang]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.reset.title}</h2>
      </CardHeader>
      <CardContent>
        <ResetForm
          labels={{
            newPassword: dict.reset.newPassword,
            submit: dict.reset.submit,
            loading: dict.reset.loading,
            invalidLink: dict.reset.invalidLink,
            expiredLink: dict.reset.expiredLink,
            sessionMissing: dict.reset.sessionMissing,
            submitFailed: dict.reset.submitFailed,
            submitSuccess: dict.reset.submitSuccess
          }}
          lang={lang}
        />
      </CardContent>
    </Card>
  );
}

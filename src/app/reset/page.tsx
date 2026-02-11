import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { getLangFromSearchParams } from "@/lib/i18n/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetForm } from "@/components/reset-form";

type ResetPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveLangFromCookie(): "zh" | "en" | null {
  const store = cookies();
  const value = store.get("nsuk_lang")?.value?.trim().toLowerCase();
  if (value === "zh" || value === "en") return value;
  return null;
}

export default function ResetPage({ searchParams }: ResetPageProps) {
  const fromQuery = getLangFromSearchParams(searchParams);
  const fromCookie = resolveLangFromCookie();

  // Most safe default: zh
  const lang = (fromQuery ?? fromCookie ?? "zh") as "zh" | "en";
  const dict = getDictionary(lang);

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
            submitSuccess: dict.reset.submitSuccess,
          }}
          lang={lang}
        />
      </CardContent>
    </Card>
  );
}

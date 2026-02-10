import { getDictionary } from "@/lib/i18n";
import { getLangFromSearchParams } from "@/lib/i18n/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetForm } from "@/components/reset-form";

type ResetPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ResetPage({ searchParams }: ResetPageProps) {
  // Prefer server-side searchParams for stable language when users copy/paste URLs
  const lang = getLangFromSearchParams(searchParams) ?? "en";
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
            submitSuccess: dict.reset.submitSuccess
          }}
          lang={lang}
        />
      </CardContent>
    </Card>
  );
}

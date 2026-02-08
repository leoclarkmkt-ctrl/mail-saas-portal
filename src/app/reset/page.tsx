import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetForm } from "@/components/reset-form";

export default function ResetPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const accessTokenValue = searchParams?.access_token;
  const accessToken = Array.isArray(accessTokenValue) ? accessTokenValue[0] : accessTokenValue;
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
            invalidLink: dict.reset.invalidLink,
            submitFailed: dict.reset.submitFailed,
            submitSuccess: dict.reset.submitSuccess
          }}
          lang={lang}
          accessToken={accessToken}
        />
      </CardContent>
    </Card>
  );
}

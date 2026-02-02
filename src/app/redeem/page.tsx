import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RedeemForm } from "@/components/redeem-form";

export default function RedeemPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.redeem.title}</h2>
        <p className="text-sm text-slate-500">{dict.common.brandZh}</p>
      </CardHeader>
      <CardContent>
        <RedeemForm
          labels={{
            activationCode: dict.redeem.activationCode,
            activationCodePlaceholder: dict.redeem.activationCodePlaceholder,
            personalEmail: dict.redeem.personalEmail,
            personalEmailHelp: dict.redeem.personalEmailHelp,
            eduUsername: dict.redeem.eduUsername,
            eduUsernameHelp: dict.redeem.eduUsernameHelp,
            password: dict.redeem.password,
            passwordHelp: dict.redeem.passwordHelp,
            submit: dict.redeem.submit,
            successTitle: dict.redeem.successTitle,
            webmail: dict.redeem.webmail,
            dashboard: dict.redeem.dashboard,
            copyInfo: dict.redeem.copyInfo,
            expiresAt: dict.dashboard.expiresAt,
            copied: dict.common.copied,
            eduEmail: dict.dashboard.eduEmail
          }}
        />
      </CardContent>
    </Card>
  );
}

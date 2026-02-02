import { getDictionary } from "@/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RedeemForm } from "@/components/redeem-form";

export default function RedeemPage() {
  const dict = getDictionary();
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
            personalEmail: dict.redeem.personalEmail,
            eduUsername: dict.redeem.eduUsername,
            password: dict.redeem.password,
            submit: dict.redeem.submit,
            successTitle: dict.redeem.successTitle,
            webmail: dict.redeem.webmail,
            dashboard: dict.redeem.dashboard,
            copyInfo: dict.redeem.copyInfo,
            expiresAt: dict.dashboard.expiresAt,
            copied: dict.common.copied,
            required: dict.redeem.required,
            failure: dict.redeem.failure,
            networkError: dict.redeem.networkError
          }}
        />
      </CardContent>
    </Card>
  );
}

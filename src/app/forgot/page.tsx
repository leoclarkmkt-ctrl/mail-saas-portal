import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ForgotForm } from "@/components/forgot-form";

export default function ForgotPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.forgot.title}</h2>
        <p className="text-sm text-slate-500">{dict.forgot.description}</p>
      </CardHeader>
      <CardContent>
        <ForgotForm
          labels={{
            email: dict.forgot.email,
            submit: dict.forgot.submit,
            notice: dict.forgot.notice
          }}
        />
      </CardContent>
    </Card>
  );
}

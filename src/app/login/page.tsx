import Link from "next/link";
import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default function LoginPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.login.title}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm
          key={lang}
          lang={lang}
          errors={dict.errors}
          labels={{
            personalTab: dict.login.personalTab,
            eduTab: dict.login.eduTab,
            email: dict.login.email,
            password: dict.login.password,
            submit: dict.login.submit
          }}
        />
        <Link className="text-sm text-slate-500" href={withLang("/forgot", lang)}>
          {dict.login.forgot}
        </Link>
      </CardContent>
    </Card>
  );
}

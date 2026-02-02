import Link from "next/link";
import { getDictionary } from "@/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const dict = getDictionary();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.login.title}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm
          labels={{
            personalTab: dict.login.personalTab,
            eduTab: dict.login.eduTab,
            email: dict.login.email,
            password: dict.login.password,
            submit: dict.login.submit
          }}
        />
        <Link className="text-sm text-slate-500" href="/forgot">
          {dict.login.forgot}
        </Link>
      </CardContent>
    </Card>
  );
}

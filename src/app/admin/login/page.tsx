import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.admin.loginTitle}</h2>
      </CardHeader>
      <CardContent>
        <AdminLoginForm labels={dict.admin.loginLabels} lang={lang} />
      </CardContent>
    </Card>
  );
}

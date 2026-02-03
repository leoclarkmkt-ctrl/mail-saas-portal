import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetForm } from "@/components/reset-form";

export default function ResetPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.reset.title}</h2>
      </CardHeader>
      <CardContent>
        <ResetForm labels={{ newPassword: dict.reset.newPassword, submit: dict.reset.submit }} />
      </CardContent>
    </Card>
  );
}

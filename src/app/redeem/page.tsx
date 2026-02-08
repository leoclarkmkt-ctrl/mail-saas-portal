import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { getRedeemCopy } from "@/lib/redeem-copy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RedeemForm } from "@/components/redeem-form";

export default function RedeemPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const copy = getRedeemCopy(lang);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{copy.title}</h2>
        <p className="text-sm text-slate-500">{dict.common.brandZh}</p>
      </CardHeader>
      <CardContent>
        <RedeemForm key={lang} copy={copy} errors={dict.errors} lang={lang} />
      </CardContent>
    </Card>
  );
}

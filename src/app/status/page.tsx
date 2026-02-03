import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getLangFromRequest, withLang } from "@/lib/i18n";
import { StatusPanel } from "@/components/status-panel";

export default async function StatusPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const session = await getAdminSession();
  if (!session) {
    redirect(withLang("/admin/login", lang));
  }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">{dict.status.title}</h2>
      <p className="text-sm text-slate-500">{dict.status.description}</p>
      <StatusPanel labels={dict.status.panel} />
    </div>
  );
}

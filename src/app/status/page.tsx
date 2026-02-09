import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getLangFromRequest } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";
import { AdminSectionHeader } from "@/components/admin-section-header";
import { StatusPanel } from "@/components/status-panel";

export default async function StatusPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const session = await getAdminSession();
  if (!session) {
    redirect(withLang("/admin/login", lang));
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <AdminSectionHeader
        title={dict.status.title}
        lang={lang}
        labels={{
          overview: dict.admin.summary,
          codes: dict.admin.codes,
          users: dict.admin.users,
          announcements: dict.admin.announcements,
          audit: dict.admin.audit,
          status: dict.admin.status
        }}
      />
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{dict.status.description}</p>
        <StatusPanel labels={dict.status.panel} />
      </div>
    </div>
  );
}

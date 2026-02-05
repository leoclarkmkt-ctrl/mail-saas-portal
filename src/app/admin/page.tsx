import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { AdminNav } from "@/components/admin-nav";
import { AdminSummary } from "@/components/admin-summary";

export default function AdminPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary">{dict.admin.overviewTitle}</h2>
        <AdminNav
          lang={lang}
          labels={{
            overview: dict.admin.summary,
            codes: dict.admin.codes,
            users: dict.admin.users,
            audit: dict.admin.audit,
            status: dict.admin.status
          }}
        />
      </div>
      <AdminSummary labels={dict.admin.summaryLabels} />
    </div>
  );
}

import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { AdminNav } from "@/components/admin-nav";
import { AdminAudit } from "@/components/admin-audit";

export default function AdminAuditPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">{dict.admin.audit}</h2>
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
      <AdminAudit labels={dict.admin.auditLabels} />
    </div>
  );
}

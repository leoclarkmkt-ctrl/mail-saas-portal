import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n";
import { AdminNav } from "@/components/admin-nav";
import { AdminCodes } from "@/components/admin-codes";

export default function AdminCodesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">{dict.admin.codes}</h2>
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
      <AdminCodes labels={dict.admin.codesLabels} />
    </div>
  );
}

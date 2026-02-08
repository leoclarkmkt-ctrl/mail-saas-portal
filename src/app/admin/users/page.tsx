import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { AdminNav } from "@/components/admin-nav";
import { AdminUsers } from "@/components/admin-users";

export default function AdminUsersPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">{dict.admin.users}</h2>
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
      <AdminUsers key={lang} lang={lang} labels={dict.admin.usersLabels} />
    </div>
  );
}

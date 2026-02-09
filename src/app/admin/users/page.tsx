import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { AdminSectionHeader } from "@/components/admin-section-header";
import { AdminUsers } from "@/components/admin-users";

export default function AdminUsersPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <AdminSectionHeader
        title={dict.admin.users}
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
      <AdminUsers key={lang} lang={lang} labels={dict.admin.usersLabels} />
    </div>
  );
}

import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { AdminSectionHeader } from "@/components/admin-section-header";
import { AdminUsers } from "@/components/admin-users";

const toSingle = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function AdminUsersPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const initialPageRaw = Number(toSingle(searchParams?.page) ?? "1");
  const initialPage = Number.isFinite(initialPageRaw) && initialPageRaw > 0 ? Math.floor(initialPageRaw) : 1;
  const initialQuery = toSingle(searchParams?.query)?.trim() ?? "";

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
      <AdminUsers key={lang} lang={lang} labels={dict.admin.usersLabels} initialPage={initialPage} initialQuery={initialQuery} />
    </div>
  );
}

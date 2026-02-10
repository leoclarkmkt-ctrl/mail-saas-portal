import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { AdminSectionHeader } from "@/components/admin-section-header";
import { AdminCodes } from "@/components/admin-codes";

const toSingle = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const STATUSES = ["all", "unused", "used", "revoked"] as const;
type Status = (typeof STATUSES)[number];

export default function AdminCodesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  const initialPageRaw = Number(toSingle(searchParams?.page) ?? "1");
  const initialPage = Number.isFinite(initialPageRaw) && initialPageRaw > 0 ? Math.floor(initialPageRaw) : 1;
  const initialQuery = toSingle(searchParams?.q)?.trim() ?? "";
  const statusRaw = toSingle(searchParams?.status) ?? "all";
  const initialStatus: Status = STATUSES.includes(statusRaw as Status) ? (statusRaw as Status) : "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <AdminSectionHeader
        title={dict.admin.codes}
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
      <AdminCodes labels={dict.admin.codesLabels} lang={lang} initialStatus={initialStatus} initialQuery={initialQuery} initialPage={initialPage} />
    </div>
  );
}

import Link from "next/link";
import { withLang } from "@/lib/i18n/shared";
import type { Locale } from "@/i18n";

type AdminNavLabels = {
  overview: string;
  codes: string;
  users: string;
  audit: string;
  status: string;
};

export function AdminNav({ lang, labels }: { lang: Locale; labels: AdminNavLabels }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-4 text-sm">
      <Link href={withLang("/admin", lang)} className="text-primary hover:underline">{labels.overview}</Link>
      <Link href={withLang("/admin/codes", lang)} className="text-primary hover:underline">{labels.codes}</Link>
      <Link href={withLang("/admin/users", lang)} className="text-primary hover:underline">{labels.users}</Link>
      <Link href={withLang("/admin/audit", lang)} className="text-primary hover:underline">{labels.audit}</Link>
      <Link href={withLang("/status", lang)} className="text-primary hover:underline">
        {labels.status}
      </Link>
    </nav>
  );
}

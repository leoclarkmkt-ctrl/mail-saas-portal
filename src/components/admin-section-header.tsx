import { AdminNav } from "@/components/admin-nav";
import type { Locale } from "@/i18n";

type AdminSectionHeaderProps = {
  title: string;
  lang: Locale;
  labels: {
    overview: string;
    codes: string;
    users: string;
    audit: string;
    status: string;
  };
};

export function AdminSectionHeader({ title, lang, labels }: AdminSectionHeaderProps) {
  return (
    <section className="mb-6 space-y-3">
      <h1 className="text-2xl font-semibold text-primary">{title}</h1>
      <AdminNav lang={lang} labels={labels} />
    </section>
  );
}

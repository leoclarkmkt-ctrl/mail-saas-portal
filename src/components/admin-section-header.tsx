import { AdminNav } from "@/components/admin-nav";
import type { Locale } from "@/i18n";

type AdminSectionHeaderProps = {
  title: string;
  lang: Locale;
  labels: {
    overview: string;
    codes: string;
    users: string;
    announcements: string;
    audit: string;
    status: string;
  };
};

export function AdminSectionHeader({ title, lang, labels }: AdminSectionHeaderProps) {
  return (
    <section className="mb-6">
      {/* 大标题 */}
      <h1 className="mb-5 text-2xl font-semibold text-primary">
        {title}
      </h1>

      {/* Tabs：字号 +1，与标题保持更大垂直间距 */}
      <div className="[&>nav]:text-base">
        <AdminNav lang={lang} labels={labels} />
      </div>
    </section>
  );
}

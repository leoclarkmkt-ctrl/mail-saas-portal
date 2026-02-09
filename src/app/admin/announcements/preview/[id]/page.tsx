import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withLang } from "@/lib/i18n/shared";
import { formatDate } from "@/lib/utils/format";
import { AnnouncementContent } from "@/components/announcement-content";

export default async function AdminAnnouncementPreviewPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getAdminSession();
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);

  if (!session) {
    redirect(withLang("/admin/login", lang));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,excerpt,content_json,is_published,published_at,updated_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{dict.admin.preview}</h1>
          <p className="text-sm text-slate-500">
            {data.is_published ? dict.admin.published : dict.admin.draft}
          </p>
        </div>
        <Link
          href={withLang("/admin/announcements", lang)}
          className="inline-flex items-center justify-center rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
        >
          {dict.common.back}
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{data.title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(data.published_at ?? data.updated_at)}
        </p>
        <div className="mt-4 text-sm text-slate-700">
          <AnnouncementContent content={data.content_json} excerpt={data.excerpt} fallback={dict.admin.contentUnsupported} />
        </div>
      </div>
    </div>
  );
}

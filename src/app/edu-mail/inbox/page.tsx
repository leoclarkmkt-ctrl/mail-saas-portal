import Link from "next/link";
import { redirect } from "next/navigation";
import { getEduMailDict } from "@/i18n/edu-mail";
import { EduMailLangSwitch } from "@/components/edu-mail-lang-switch";
import { getEduMailLang, withEduLang } from "@/lib/edu-mail/i18n";
import { getUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import { LogoutButton, RefreshButton } from "@/components/edu-mail-actions";

const buildInboxLink = (id: string | null, lang: "en" | "zh") => {
  if (!id) return withEduLang("/edu-mail/inbox", lang);
  const url = new URL(withEduLang("/edu-mail/inbox", lang), "http://localhost");
  url.searchParams.set("id", id);
  return url.pathname + url.search;
};

export default async function EduMailInboxPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getEduMailLang(searchParams);
  const dict = getEduMailDict(lang);
  const session = await getUserSession();
  if (!session || session.mode !== "edu") {
    redirect(withEduLang("/edu-mail/login", lang));
  }

  const supabase = createServerSupabaseClient();
  const { data: mailboxData } = await supabase
    .from("user_mailboxes")
    .select("edu_email")
    .eq("owner_user_id", session.userId)
    .limit(1);

  const eduEmail = mailboxData?.[0]?.edu_email ?? "edu@nsuk.edu.kg";

  const { data: messages } = await supabase
    .from("email_messages")
    .select("id, subject, mail_from, received_at")
    .eq("owner_user_id", session.userId)
    .order("received_at", { ascending: false });

  const selectedId = typeof searchParams?.id === "string" ? searchParams.id : null;

  const { data: messageDetail } = selectedId
    ? await supabase
        .from("email_messages")
        .select("id, subject, mail_from, received_at, text_plain, html_body, raw_rfc822")
        .eq("owner_user_id", session.userId)
        .eq("id", selectedId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Edu Inbox</p>
            <p className="text-lg font-semibold text-primary">{eduEmail}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EduMailLangSwitch currentLang={lang} labels={dict.langLabel} />
            <LogoutButton lang={lang} labels={{ logout: dict.inbox.logout, loggingOut: dict.inbox.loggingOut }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-primary">{dict.inbox.title}</h2>
        <RefreshButton labels={{ refresh: dict.inbox.refresh, refreshing: dict.inbox.refreshing }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <Link
                key={message.id}
                href={buildInboxLink(message.id, lang)}
                className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                  message.id === selectedId
                    ? "border-accent bg-accent/5"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {dict.inbox.from}: {message.mail_from ?? dict.inbox.unknownSender}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {message.subject ?? dict.inbox.noSubject}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {dict.inbox.received}: {message.received_at ? formatDate(message.received_at) : "--"}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-base font-semibold text-slate-700">{dict.inbox.emptyTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{dict.inbox.emptyBody}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {messageDetail ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">
                  {dict.inbox.from}: {messageDetail.mail_from ?? dict.inbox.unknownSender}
                </p>
                <h3 className="text-xl font-semibold text-primary">
                  {messageDetail.subject ?? dict.inbox.noSubject}
                </h3>
                <p className="text-xs text-slate-400">
                  {dict.inbox.received}: {messageDetail.received_at ? formatDate(messageDetail.received_at) : "--"}
                </p>
              </div>

              {messageDetail.text_plain ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <pre className="whitespace-pre-wrap font-sans">{messageDetail.text_plain}</pre>
                </div>
              ) : messageDetail.html_body ? (
                <iframe
                  title="Email content"
                  className="min-h-[360px] w-full rounded-xl border border-slate-200"
                  sandbox="allow-same-origin"
                  srcDoc={messageDetail.html_body}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {dict.inbox.noContent}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-slate-500">
              <p className="text-base font-semibold text-slate-700">
                {dict.inbox.detailPlaceholderTitle}
              </p>
              <p className="mt-2 text-sm">{dict.inbox.detailPlaceholderBody}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

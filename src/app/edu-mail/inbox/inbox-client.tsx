"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/language-switch";
import { LogoutButton } from "@/components/edu-mail-actions";
import { formatDate } from "@/lib/utils/format";
import { withLang } from "@/lib/i18n/shared";

type InboxClientProps = {
  lang: "en" | "zh";
  dict: {
    inbox: {
      title: string;
      logout: string;
      loggingOut: string;
      refresh: string;
      refreshing: string;
      from: string;
      unknownSender: string;
      noSubject: string;
      received: string;
      emptyTitle: string;
      emptyBody: string;
      noContent: string;
      detailPlaceholderTitle: string;
      detailPlaceholderBody: string;
    };
  };
  selectedId: string | null;
};

type InboxMessage = {
  id: string;
  subject: string | null;
  mail_from: string | null;
  received_at: string | null;
};

type MessageDetail = InboxMessage & {
  text_plain: string | null;
  html_body: string | null;
};

const buildInboxLink = (id: string | null, lang: "en" | "zh") => {
  if (!id) return withLang("/edu-mail/inbox", lang);
  const url = new URL(withLang("/edu-mail/inbox", lang), "http://localhost");
  url.searchParams.set("id", id);
  return url.pathname + url.search;
};

export function InboxClient({ lang, dict, selectedId }: InboxClientProps) {
  const [eduEmail, setEduEmail] = useState<string>("edu@nsuk.edu.kg");
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [messageDetail, setMessageDetail] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/edu-mail/messages?limit=5", { credentials: "include" });
      const data = (await res.json()) as {
        ok: boolean;
        edu_email?: string | null;
        messages?: InboxMessage[];
      };
      if (data.ok) {
        setEduEmail(data.edu_email ?? "edu@nsuk.edu.kg");
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessageDetail = useCallback(
    async (id: string | null) => {
      if (!id) {
        setMessageDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/edu-mail/message?id=${id}`, { credentials: "include" });
        const data = (await res.json()) as { ok: boolean; message?: MessageDetail };
        if (data.ok && data.message) {
          setMessageDetail(data.message);
        } else {
          setMessageDetail(null);
        }
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessageDetail(selectedId);
  }, [fetchMessageDetail, selectedId]);

  const listContent = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            {dict.inbox.refreshing}
          </p>
        </div>
      );
    }
    if (messages.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            {dict.inbox.emptyTitle}
          </p>
          <p className="mt-2 text-sm text-slate-500">{dict.inbox.emptyBody}</p>
        </div>
      );
    }
    return messages.map((message) => (
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
            {dict.inbox.received}:{" "}
            {message.received_at ? formatDate(message.received_at) : "--"}
          </p>
        </div>
      </Link>
    ));
  }, [dict.inbox, lang, loading, messages, selectedId]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {dict.inbox.title}
            </p>
            <p className="text-lg font-semibold text-primary">{eduEmail}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitch currentLang={lang} />
            <LogoutButton
              lang={lang}
              labels={{ logout: dict.inbox.logout, loggingOut: dict.inbox.loggingOut }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-primary">{dict.inbox.title}</h2>
        <Button
          type="button"
          variant="outline"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => {
            fetchMessages();
            fetchMessageDetail(selectedId);
          }}
          disabled={loading || detailLoading}
        >
          {loading || detailLoading ? dict.inbox.refreshing : dict.inbox.refresh}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-4">{listContent}</div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {detailLoading ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-slate-500">
              <p className="text-base font-semibold text-slate-700">
                {dict.inbox.refreshing}
              </p>
            </div>
          ) : messageDetail ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">
                  {dict.inbox.from}: {messageDetail.mail_from ?? dict.inbox.unknownSender}
                </p>
                <h3 className="text-xl font-semibold text-primary">
                  {messageDetail.subject ?? dict.inbox.noSubject}
                </h3>
                <p className="text-xs text-slate-400">
                  {dict.inbox.received}:{" "}
                  {messageDetail.received_at ? formatDate(messageDetail.received_at) : "--"}
                </p>
              </div>

              {messageDetail.text_plain ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <pre className="whitespace-pre-wrap font-sans">
                    {messageDetail.text_plain}
                  </pre>
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

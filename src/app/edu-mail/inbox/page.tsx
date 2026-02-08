import { redirect } from "next/navigation";

import { getLocaleFromCookies, getDictionary } from "@/lib/i18n/server";
import { getLangFromSearchParams, withLang } from "@/lib/i18n/shared";
import { getUserSession } from "@/lib/auth/user-session";
import { InboxClient } from "./inbox-client";

export default async function EduMailInboxPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getLangFromSearchParams(searchParams) ?? getLocaleFromCookies();
  const dict = getDictionary(lang);

  const session = await getUserSession();
  if (!session || session.mode !== "edu") {
    redirect(withLang("/edu-mail/login", lang));
  }

  const selectedId =
    typeof searchParams?.id === "string" ? searchParams.id : null;

  return (
    <InboxClient lang={lang} dict={dict} selectedId={selectedId} />
  );
}

import { redirect } from "next/navigation";

import { getLangFromRequest, withLang } from "@/lib/i18n";
import { getEduMailDict } from "@/i18n/edu-mail";
import { getUserSession } from "@/lib/auth/user-session";
import { InboxClient } from "./inbox-client";

export default async function EduMailInboxPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getLangFromRequest(searchParams);
  const dict = getEduMailDict(lang);

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

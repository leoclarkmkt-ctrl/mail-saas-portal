import { redirect } from "next/navigation";

import { getLocaleFromCookies } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";

export default async function EduMailIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const qp = searchParams?.lang;
  const langQuery = typeof qp === "string" ? qp : Array.isArray(qp) ? qp[0] : undefined;
  const langCookie = getLocaleFromCookies();
  const lang = langQuery === "zh" ? "zh" : langQuery === "en" ? "en" : langCookie;

  redirect(withLang("/edu-mail/inbox", lang));
}

import { NextRequest, NextResponse } from "next/server";

import { createUserSession, getUserSession } from "@/lib/auth/user-session";
import { withLang } from "@/lib/i18n/shared";

export const runtime = "nodejs";

function getLangFromUrl(requestUrl: URL): "en" | "zh" {
  const lang = requestUrl.searchParams.get("lang");
  return lang === "zh" ? "zh" : "en";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const lang = getLangFromUrl(requestUrl);
  const session = await getUserSession();
  const loginUrl = new URL(withLang("/login", lang), requestUrl);

  if (!session || session.mode !== "personal") {
    return NextResponse.redirect(loginUrl);
  }

  await createUserSession({ userId: session.userId, mode: "edu" });

  const inboxUrl = new URL(withLang("/edu-mail/inbox", lang), requestUrl);
  return NextResponse.redirect(inboxUrl);
}

import { NextRequest, NextResponse } from "next/server";

import { createUserSession, requireUserSession } from "@/lib/auth/user-session";
import { withLang } from "@/lib/i18n/shared";

export const runtime = "nodejs";

const getLangFromUrl = (url: URL): "en" | "zh" => {
  const raw = url.searchParams.get("lang");
  return raw === "en" ? "en" : "zh";
};

export async function GET(request: NextRequest) {
  const respondRedirect = (url: URL) => {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const requestUrl = new URL(request.url);
  const lang = getLangFromUrl(requestUrl);
  const session = await requireUserSession();
  const loginUrl = new URL(withLang("/login", lang), requestUrl);

  if (!session || session.mode !== "edu") {
    return respondRedirect(loginUrl);
  }

  await createUserSession({ userId: session.userId, mode: "personal" });

  const dashboardUrl = new URL(withLang("/dashboard", lang), requestUrl);
  return respondRedirect(dashboardUrl);
}

import { NextRequest, NextResponse } from "next/server";

import { createUserSession, getUserSession } from "@/lib/auth/user-session";
import { withLang } from "@/lib/i18n/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getLangFromUrl(requestUrl: URL): "en" | "zh" {
  const lang = requestUrl.searchParams.get("lang");
  return lang === "zh" ? "zh" : "en";
}

export async function GET(request: NextRequest) {
  const respondRedirect = (url: URL) => {
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const requestUrl = new URL(request.url);
  const lang = getLangFromUrl(requestUrl);
  const session = await getUserSession();
  const loginUrl = new URL(withLang("/login", lang), requestUrl);

  if (!session || session.mode !== "personal") {
    return respondRedirect(loginUrl);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("edu_accounts")
    .select("expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  const expiresAtMs = data?.expires_at ? Date.parse(data.expires_at) : NaN;
  const expired = Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
  const active = data?.status === "active" && !expired;

  if (error || !data || !active) {
    const dashboardUrl = new URL(withLang("/dashboard", lang), requestUrl);
    dashboardUrl.searchParams.set("edu", "expired");
    return respondRedirect(dashboardUrl);
  }

  await createUserSession({ userId: session.userId, mode: "edu" });

  const inboxUrl = new URL(withLang("/edu-mail/inbox", lang), requestUrl);
  return respondRedirect(inboxUrl);
}

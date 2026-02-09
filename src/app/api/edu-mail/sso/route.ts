import { NextRequest, NextResponse } from "next/server";

import { createUserSession, getUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withLang } from "@/lib/i18n/shared";

// 你仓库里如果已有 getLangFromSearchParams / getLangFromUrl，请保留你现有的名字。
// 这里用最稳的：从 URL 的 searchParams 解析 lang=zh/en，默认 zh。
const getLangFromUrl = (url: URL): "en" | "zh" => {
  const raw = url.searchParams.get("lang");
  return raw === "en" ? "en" : "zh";
};

export const runtime = "nodejs";

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

  // Guard: re-check edu account status/expiry before upgrading session
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

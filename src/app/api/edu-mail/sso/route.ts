import { NextRequest, NextResponse } from "next/server";

import { createUserSession, requireUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withLang } from "@/lib/i18n/shared";

export const runtime = "nodejs";

// 从 URL 的 searchParams 解析 lang=zh/en，默认 zh
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

  // 必须是 personal session 才允许 SSO
  if (!session || session.mode !== "personal") {
    return respondRedirect(loginUrl);
  }

  // Guard：切换为 edu session 前，重新检查 edu_accounts 的状态与到期时间
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("edu_accounts")
    .select("expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  const expiresAtMs = data?.expires_at ? Date.parse(data.expires_at) : NaN;
  const expired = Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
  const active = data?.status === "active" && !expired;

  // 过期/非 active/查不到数据/查询报错：回 dashboard 并携带 edu=expired 触发弹窗
  if (error || !data || !active) {
    const dashboardUrl = new URL(withLang("/dashboard", lang), requestUrl);
    dashboardUrl.searchParams.set("edu", "expired");
    return respondRedirect(dashboardUrl);
  }

  // 通过校验：升级为 edu session，并跳转 inbox
  await createUserSession({ userId: session.userId, mode: "edu" });

  const inboxUrl = new URL(withLang("/edu-mail/inbox", lang), requestUrl);
  return respondRedirect(inboxUrl);
}

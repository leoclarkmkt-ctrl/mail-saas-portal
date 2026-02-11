import { NextRequest } from "next/server";
import {
  createServerSupabaseAnonClient,
  createServerSupabaseClient
} from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/env";
import { jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeTrimLower } from "@/lib/safe-trim";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  /**
   * Error keys:
   * - forgot_email_required
   *
   * ⚠️ 注意：
   * - 无论邮箱是否存在，合法请求一律返回 200 { ok: true }
   * - 防止邮箱枚举
   */

  const rateLimitResponse = await enforceRateLimit(request, "forgot", {
    requests: 3,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonFieldError("personal_email", "forgot_email_required", 400);
  }

  const personal_email = safeTrimLower(body.personal_email);
  if (!personal_email) {
    return jsonFieldError("personal_email", "forgot_email_required", 400);
  }

  // service-role：仅用于查询 profile 是否存在（绕过 RLS）
  const supabase = createServerSupabaseClient();
  // anon：仅用于触发 Supabase Auth 发送 recovery 邮件
  const authClient = createServerSupabaseAnonClient();
  const { APP_BASE_URL } = getAppBaseUrl();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("personal_email", personal_email)
    .maybeSingle();

  /**
   * ✅ 关键：必须让 redirectTo 自带 lang
   *
   * 原问题根因：
   * - 以前 redirectTo 是 /reset（不带 lang）
   * - 你 middleware 会对“缺 lang 的请求”做 302 补参
   * - 但 recovery 的 access_token 在 URL 的 #fragment 里，fragment 不会发送给服务器
   * - 所以服务器 302 时根本带不走 fragment -> token 丢失 -> /reset 拿不到 session
   * - 表现就是：点“重置密码”没反应 / Failed to fetch
   *
   * 解决：
   * - 直接把 redirectTo 设为 /reset?lang=xx
   * - middleware 不再重定向，fragment 会完整保留到 reset 页面
   */

  // 解析 lang：优先 query，其次 cookie，否则默认 zh
  const url = new URL(request.url);
  const qLang = url.searchParams.get("lang")?.trim().toLowerCase();
  const cLang = request.cookies.get("nsuk_lang")?.value?.trim().toLowerCase();
  const lang =
    qLang === "zh" || qLang === "en"
      ? qLang
      : cLang === "zh" || cLang === "en"
        ? cLang
        : "zh";

  if (profile) {
    const { error } = await authClient.auth.resetPasswordForEmail(personal_email, {
      // ✅ 以前：`${APP_BASE_URL}/reset`
      // ✅ 现在：`${APP_BASE_URL}/reset?lang=${lang}`（避免 middleware 302 吃掉 fragment）
      redirectTo: `${APP_BASE_URL}/reset?lang=${lang}`
    });

    if (error) {
      // ❗只记录日志，不向客户端暴露任何内部信息
      console.error("[forgot] resetPasswordForEmail_failed", {
        email: personal_email,
        message: error.message
      });
    }
  }

  return jsonSuccess({ ok: true });
}

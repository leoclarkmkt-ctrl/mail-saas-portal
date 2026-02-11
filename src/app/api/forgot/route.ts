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

/**
 * 这个接口的职责：
 * 1) 接收 personal_email
 * 2) 如果该邮箱存在 profiles，则触发 Supabase 发送 recovery 邮件
 * 3) 无论邮箱是否存在，都返回 200 { ok: true }（防邮箱枚举）
 *
 * ✅ 关键修复点：
 * 把 reset 邮件的 redirectTo 从 /reset 改为 /auth/verify（站内接管），
 * 避免 Supabase verify -> /reset 的过程中 access_token/fragment 丢失，
 * 导致 /reset 页面拿不到 session，表现为“点重置没反应 / Failed to fetch”。
 */
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

  // 使用 service-role 绕过 RLS，仅用于查询 profile 是否存在
  const supabase = createServerSupabaseClient();
  // anon client 仅用于发送 reset 邮件（Supabase Auth）
  const authClient = createServerSupabaseAnonClient();
  const { APP_BASE_URL } = getAppBaseUrl();

  // 1) 只要 profile 存在，我们才触发发邮件（避免对不存在邮箱发起 auth 请求）
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("personal_email", personal_email)
    .maybeSingle();

  /**
   * 2) 解析 lang（可选，但推荐）
   * 优先级：
   * - URL query: /api/forgot?lang=zh|en（前端可以带）
   * - Cookie: nsuk_lang=zh|en（你语言切换会写）
   * - 默认：zh（与你 middleware 的默认一致）
   */
  const url = new URL(request.url);
  const qLang = url.searchParams.get("lang")?.trim().toLowerCase();
  const cLang = request.cookies.get("nsuk_lang")?.value?.trim().toLowerCase();
  const lang = (qLang === "zh" || qLang === "en")
    ? qLang
    : (cLang === "zh" || cLang === "en")
      ? cLang
      : "zh";

  /**
   * 3) 最关键：redirectTo 改为站内 /auth/verify
   *
   * 为什么？
   * - Supabase recovery 邮件点击后会先到 supabase.co/auth/v1/verify?...&redirect_to=...
   * - 如果 redirect_to 直接是 /reset，token 往往会在中间（重定向/middleware）丢失
   * - 你仓库里已经有 src/app/auth/verify/route.ts，可用于“接住 verify 回跳并 setSession”
   *
   * 这里我们把“最终要去的页面”作为 redirect_to 传给 /auth/verify：
   * /auth/verify?redirect_to=/reset?lang=xx
   */
  const finalRedirectPath = `/reset?lang=${lang}`;
  const verifyRedirectUrl =
    `${APP_BASE_URL}/auth/verify?redirect_to=${encodeURIComponent(finalRedirectPath)}`;

  if (profile) {
    const { error } = await authClient.auth.resetPasswordForEmail(personal_email, {
      // ✅ 以前是 `${APP_BASE_URL}/reset`
      // ✅ 现在改成让站内 verify route 接管，保证 token/session 不丢
      redirectTo: verifyRedirectUrl
    });

    if (error) {
      // ❗只记录日志，不向客户端暴露任何内部信息
      console.error("[forgot] resetPasswordForEmail_failed", {
        email: personal_email,
        message: error.message
      });
    }
  }

  // 统一成功响应（无论邮箱是否存在 / 是否真正发送）
  return jsonSuccess({ ok: true });
}

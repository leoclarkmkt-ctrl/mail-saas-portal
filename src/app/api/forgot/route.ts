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

  // 使用 service-role 绕过 RLS，仅用于查询 profile 是否存在
  const supabase = createServerSupabaseClient();
  // anon client 仅用于发送 reset 邮件
  const authClient = createServerSupabaseAnonClient();
  const { APP_BASE_URL } = getAppBaseUrl();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("personal_email", personal_email)
    .maybeSingle();

  if (profile) {
    const { error } = await authClient.auth.resetPasswordForEmail(personal_email, {
      redirectTo: `${APP_BASE_URL}/reset`
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

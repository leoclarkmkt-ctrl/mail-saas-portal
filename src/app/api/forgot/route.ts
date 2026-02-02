import { NextRequest, NextResponse } from "next/server";
import { forgotSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/utils/api";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type ErrorPayload = {
  code: string;
  message: string;
  detail?: string;
};

function getLocale() {
  const cookieLocale = cookies().get("portal-lang")?.value;
  return cookieLocale === "zh" ? "zh" : "en";
}

function jsonError(payload: ErrorPayload, status = 400) {
  return NextResponse.json(payload, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ ok: true });
  }

  const locale = getLocale();
  const APP_BASE_URL = process.env.APP_BASE_URL;

  if (!APP_BASE_URL) {
    return jsonError({
      code: "missing_env",
      message: locale === "zh" ? "缺少必要环境变量 APP_BASE_URL。" : "Missing required env APP_BASE_URL.",
      detail:
        locale === "zh"
          ? "请在部署环境中配置 APP_BASE_URL（例如 https://portal.nsuk.edu.kg）。"
          : "Set APP_BASE_URL in the deployment environment (e.g. https://portal.nsuk.edu.kg)."
    });
  }

  let supabase;
  try {
    supabase = createServerSupabaseAnonClient();
  } catch (error) {
    return jsonError({
      code: "missing_env",
      message:
        locale === "zh"
          ? "缺少 Supabase 环境变量，无法发送重置邮件。"
          : "Missing Supabase env values, cannot send reset email.",
      detail: error instanceof Error ? error.message : undefined
    });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.personal_email, {
    redirectTo: `${APP_BASE_URL}/reset`
  });

  if (error) {
    const message = error.message ?? "";
    const isRedirectError = /redirect|url|not allowed/i.test(message);
    if (isRedirectError) {
      return jsonError({
        code: "invalid_redirect",
        message:
          locale === "zh"
            ? "Supabase Auth 未允许该回跳地址。"
            : "Supabase Auth redirect URL is not allowed.",
        detail:
          locale === "zh"
            ? "请在 Supabase → Authentication → URL Configuration 添加 Redirect URL: APP_BASE_URL/reset。"
            : "Add Redirect URL: APP_BASE_URL/reset in Supabase → Authentication → URL Configuration."
      });
    }

    return jsonError({
      code: "supabase_error",
      message: locale === "zh" ? "发送失败，请稍后重试。" : "Failed to send. Please try again.",
      detail: message || undefined
    }, 502);
  }

  return jsonSuccess({ ok: true });
}

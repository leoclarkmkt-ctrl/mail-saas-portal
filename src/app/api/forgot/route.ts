import { NextRequest } from "next/server";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/env";
import { jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeTrimLower } from "@/lib/safe-trim";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  /**
   * Error keys:
   * - forgot_email_required
   * - forgot_email_not_found
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

  const supabase = createServerSupabaseAnonClient();
  const { APP_BASE_URL } = getAppBaseUrl();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("personal_email", personal_email)
    .maybeSingle();
  if (!profile) {
    return jsonFieldError("personal_email", "forgot_email_not_found", 404);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(personal_email, {
    redirectTo: `${APP_BASE_URL}/reset`
  });

  if (error) {
    const message = error.message ?? "";
    const isRedirectError = /redirect|url|not allowed/i.test(message);
    if (isRedirectError) {
      return jsonSuccess({
        ok: true,
        hint: "Supabase Auth URL 配置未允许该回跳地址。请在 Supabase → Authentication → URL Configuration 添加 Redirect URL: APP_BASE_URL/reset (e.g. https://portal.nsuk.edu.kg/reset)."
      });
    }
    return jsonFieldError("personal_email", "unknown", 400, message);
  }

  return jsonSuccess({ ok: true });
}

import { NextRequest } from "next/server";
import { forgotSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ ok: true });
  }

  const supabase = createServerSupabaseAnonClient();
  const { APP_BASE_URL } = getServerEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.personal_email, {
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
  }

  return jsonSuccess({ ok: true });
}

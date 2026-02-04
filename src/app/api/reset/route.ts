import { NextRequest } from "next/server";
import { resetSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request, "reset", {
    requests: 3,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;
  getServerEnv();
  const body = await request.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const supabase = createServerSupabaseClient();
  const authed = createServerSupabaseAnonClient();
  await authed.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: ""
  });
  const { error } = await authed.auth.updateUser({ password: parsed.data.new_password });
  if (error) {
    const message = error.message ?? "Reset failed";
    const isRedirectError = /redirect|url|not allowed/i.test(message);
    return jsonError(
      isRedirectError
        ? "Redirect URL mismatch. Please add APP_BASE_URL/reset in Supabase → Authentication → URL Configuration. / 回跳地址不匹配，请在 Supabase → Authentication → URL Configuration 添加 APP_BASE_URL/reset。"
        : message,
      400
    );
  }
  const user = await authed.auth.getUser();
  if (user.data.user) {
    await supabase.from("audit_logs").insert({
      user_id: user.data.user.id,
      action: "user_password_reset"
    });
  }

  return jsonSuccess({ ok: true });
}

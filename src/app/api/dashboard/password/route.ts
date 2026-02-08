import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionEnv } from "@/lib/env";
import { clearUserSession, getUserSession } from "@/lib/auth/user-session";
import { jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  getSessionEnv();
  const lang = request.nextUrl.searchParams.get("lang") === "zh" ? "zh" : "en";
  const message = (key: string) => {
    const zh = {
      unauthorized: "未授权",
      invalidInput: "提交内容无效",
      userNotFound: "未找到用户",
      invalidPassword: "原密码不正确",
      suspended: "账号已冻结",
      updateFailed: "更新失败",
      internalError: "服务器内部错误"
    };
    const en = {
      unauthorized: "Unauthorized",
      invalidInput: "Invalid input",
      userNotFound: "User not found",
      invalidPassword: "Invalid password",
      suspended: "Account suspended",
      updateFailed: "Update failed",
      internalError: "Internal error"
    };
    const dict = lang === "zh" ? zh : en;
    return dict[key as keyof typeof dict] ?? dict.internalError;
  };
  const errorResponse = (code: string, msg: string, detail: unknown, status: number) =>
    NextResponse.json({ code, message: msg, detail }, { status });

  const session = await getUserSession();
  if (!session) {
    return errorResponse("unauthorized", message("unauthorized"), null, 401);
  }
  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_input", message("invalidInput"), null, 400);
  }

  const supabase = createServerSupabaseClient();
  const authClient = createServerSupabaseAnonClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("personal_email, is_suspended, user_id")
    .eq("user_id", session.userId)
    .single();
  if (error || !data) {
    return errorResponse("user_not_found", message("userNotFound"), error?.message ?? null, 404);
  }
  if (data.is_suspended) {
    clearUserSession();
    return errorResponse("account_suspended", message("suspended"), null, 403);
  }
  const signIn = await authClient.auth.signInWithPassword({
    email: data.personal_email,
    password: parsed.data.old_password
  });
  if (signIn.error) {
    return errorResponse("invalid_password", message("invalidPassword"), signIn.error.message, 403);
  }
  const update = await supabase.auth.admin.updateUserById(session.userId, {
    password: parsed.data.new_password
  });
  if (update.error) {
    return errorResponse(
      "auth_update_failed",
      message("updateFailed"),
      update.error.message,
      400
    );
  }
  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_password_change"
  });
  return jsonSuccess({ ok: true });
}

import { NextRequest } from "next/server";
import { redeemSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionEnv, getSupabaseServiceEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";
import { createMailbox } from "@/lib/mailcow";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { isBlockedPersonalEmail } from "@/lib/validation/email-domain";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request, "redeem", {
    requests: 3,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;
  const safeString = (value: unknown) => {
    if (value instanceof Error) return value.message;
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return "Unknown error";
    }
  };
  const isSchemaMissing = (message: string) =>
    /relation .* does not exist|schema cache|permission denied/i.test(message);
  const lang = request.nextUrl.searchParams.get("lang") === "zh" ? "zh" : "en";
  const message = (key: string) => {
    const zh = {
      missingEnv: "缺少服务器环境配置",
      invalidInput: "提交内容无效",
      schemaMissing: "数据库结构缺失",
      redeemFailed: "兑换失败",
      mailcowFailed: "邮箱创建失败，请稍后重试。",
      internalError: "服务器内部错误",
      alreadyHasEducationAccount: "您已拥有教育邮箱，请登录学生中心控制台查看！",
      personalEmailDomainBlocked: "个人邮箱不能使用 @nsuk.edu.kg，请填写你的常用个人邮箱（如 Gmail/Outlook 等）。"
    };
    const en = {
      missingEnv: "Missing environment configuration",
      invalidInput: "Invalid input",
      schemaMissing: "Database schema missing",
      redeemFailed: "Redeem failed",
      mailcowFailed: "Mailbox creation failed. Please try again.",
      internalError: "Internal error",
      alreadyHasEducationAccount: "You already have an education account. Please log in to your student console!",
      personalEmailDomainBlocked: "Personal email cannot be an @nsuk.edu.kg address. Please use a personal mailbox (e.g., Gmail/Outlook)."
    };
    const dict = lang === "zh" ? zh : en;
    return dict[key as keyof typeof dict] ?? dict.internalError;
  };

  try {
    try {
      getSupabaseServiceEnv();
      getSessionEnv();
    } catch (error) {
      return jsonError(message("missingEnv"), 500, { detail: safeString(error) });
    }
    const body = await request.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(message("invalidInput"), 400);
    }

    const { activation_code, personal_email, edu_username, password } = parsed.data;
    const normalizedPersonalEmail = personal_email.trim().toLowerCase();
    if (isBlockedPersonalEmail(normalizedPersonalEmail)) {
      return jsonError(message("personalEmailDomainBlocked"), 400);
    }
    const supabase = createServerSupabaseClient();
    const authAdmin = supabase.auth.admin;

    let authUserId: string;
    let createdNewUser = false;
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("personal_email", normalizedPersonalEmail)
      .maybeSingle();
    if (existingProfile?.user_id) {
      authUserId = existingProfile.user_id;
      const update = await authAdmin.updateUserById(authUserId, { password });
      if (update.error) {
        const errorMessage = update.error.message ?? "Failed to update password";
        if (isSchemaMissing(errorMessage)) {
          return jsonError(message("schemaMissing"), 500, {
            detail: "schema missing: run supabase/schema.sql + migrations"
          });
        }
        return jsonError(errorMessage, 400);
      }
    } else {
      const created = await authAdmin.createUser({
        email: normalizedPersonalEmail,
        password,
        email_confirm: true
      });
      if (created.error || !created.data.user) {
        const errorMessage = created.error?.message ?? "Failed to create user";
        if (isSchemaMissing(errorMessage)) {
          return jsonError(message("schemaMissing"), 500, {
            detail: "schema missing: run supabase/schema.sql + migrations"
          });
        }
        return jsonError(errorMessage, 400);
      }
      authUserId = created.data.user.id;
      createdNewUser = true;
      const upsert = await supabase.from("profiles").upsert(
        { id: authUserId, user_id: authUserId, personal_email: normalizedPersonalEmail, is_suspended: false },
        { onConflict: "user_id" }
      );
      if (upsert.error) {
        const errorMessage = upsert.error.message;
        if (isSchemaMissing(errorMessage)) {
          return jsonError(message("schemaMissing"), 500, {
            detail: "schema missing: run supabase/schema.sql + migrations"
          });
        }
        return jsonError(errorMessage, 400);
      }
    }

    const { data, error } = await supabase.rpc("redeem_activation_code", {
      p_code: activation_code,
      p_user_id: authUserId,
      p_personal_email: normalizedPersonalEmail,
      p_edu_username: edu_username
    });

    if (error || !data?.[0]) {
      const failureMessage = error?.message ?? message("redeemFailed");

      // 🆕 新增：检查是否是"已拥有教育邮箱"的错误
      if (failureMessage.includes("User already has education account")) {
        return jsonError(message("alreadyHasEducationAccount"), 400);
      }

      if (isSchemaMissing(failureMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations"
        });
      }
      return jsonError(failureMessage, 400);
    }

    const result = data[0];
    const mailcowResult = await createMailbox(result.edu_email, password);
    if (!mailcowResult.ok) {
      let cleanupError: string | null = null;
      if (createdNewUser) {
        try {
          const { error: profileDeleteError } = await supabase
            .from("profiles")
            .delete()
            .eq("user_id", authUserId);
          if (profileDeleteError) {
            cleanupError = profileDeleteError.message;
          }
          const { error: authDeleteError } = await authAdmin.deleteUser(authUserId);
          if (authDeleteError) {
            cleanupError = cleanupError
              ? `${cleanupError}; auth delete: ${authDeleteError.message}`
              : `auth delete: ${authDeleteError.message}`;
          }
        } catch (error) {
          cleanupError = error instanceof Error ? error.message : String(error);
        }
        await supabase.from("audit_logs").insert({
          user_id: authUserId,
          action: "redeem_mailcow_failed_cleanup",
          meta: cleanupError ? { error: cleanupError } : { ok: true }
        });
      }
      await supabase
        .from("activation_codes")
        .update({ status: "unused", used_at: null, used_by_user_id: null })
        .eq("code", activation_code);
      return jsonError(message("mailcowFailed"), 502, {
        detail: mailcowResult.detail ?? mailcowResult.error,
        cleanup_error: cleanupError ?? undefined
      });
    }
    const finalUpsert = await supabase.from("profiles").upsert(
      { id: authUserId, user_id: authUserId, personal_email: normalizedPersonalEmail },
      { onConflict: "user_id" }
    );
    if (finalUpsert.error) {
      const errorMessage = finalUpsert.error.message;
      if (isSchemaMissing(errorMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations"
        });
      }
      return jsonError(errorMessage, 400);
    }
    await createUserSession({ userId: result.user_id, mode: "personal" });

    return jsonSuccess({
      personal_email: result.personal_email,
      edu_email: result.edu_email,
      expires_at: result.expires_at,
      password,
      webmail: "https://mail.nsuk.edu.kg/"
    });
  } catch (error) {
    return jsonError(message("internalError"), 500, { detail: safeString(error) });
  }
}

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionEnv, getSupabaseServiceEnv } from "@/lib/env";
import { jsonError, jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { isBlockedPersonalEmail } from "@/lib/validation/email-domain";
import { safeTrim, safeTrimLower } from "@/lib/safe-trim";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  /**
   * Error keys:
   * - activation_code_required
   * - activation_code_not_found
   * - activation_code_used
   * - personal_email_required
   * - personal_email_invalid
   * - personal_email_disallowed_domain
   * - personal_email_exists
   * - edu_username_required
   * - edu_username_invalid
   * - edu_username_exists
   * - password_required
   * - password_invalid
   */
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

  const isSchemaMissing = (messageText: string) =>
    /relation .* does not exist|schema cache|permission denied/i.test(messageText);

  const lang = request.nextUrl.searchParams.get("lang") === "zh" ? "zh" : "en";
  const message = (key: string) => {
    const zh = {
      missingEnv: "缺少服务器环境配置",
      invalidInput: "提交内容无效",
      schemaMissing: "数据库结构缺失",
      redeemFailed: "兑换失败",
      internalError: "服务器内部错误",
      alreadyHasEducationAccount: "您已拥有教育邮箱，请登录学生中心控制台查看！",
      personalEmailDomainBlocked: "个人邮箱不能使用 @nsuk.edu.kg，请填写你的常用个人邮箱（如 Gmail/Outlook 等）。"
    };
    const en = {
      missingEnv: "Missing environment configuration",
      invalidInput: "Invalid input",
      schemaMissing: "Database schema missing",
      redeemFailed: "Redeem failed",
      internalError: "Internal error",
      alreadyHasEducationAccount:
        "You already have an education account. Please log in to your student console!",
      personalEmailDomainBlocked:
        "Personal email cannot be an @nsuk.edu.kg address. Please use a personal mailbox (e.g., Gmail/Outlook)."
    };
    const dict = lang === "zh" ? zh : en;
    return dict[key as keyof typeof dict] ?? dict.internalError;
  };

  const getErrorMeta = (err: unknown) => {
    const record =
      typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null;

    const messageText =
      typeof err === "string"
        ? err
        : typeof record?.message === "string"
        ? record.message
        : "";

    const detailsText = typeof record?.details === "string" ? record.details : "";
    const hintText = typeof record?.hint === "string" ? record.hint : "";
    const codeText = typeof record?.code === "string" ? record.code : "";
    const constraintText = typeof record?.constraint === "string" ? record.constraint : "";
    const statusCode = typeof record?.status === "number" ? record.status : undefined;

    const combined = `${messageText} ${detailsText} ${hintText} ${constraintText}`.toLowerCase();

    return {
      messageText,
      detailsText,
      hintText,
      codeText,
      constraintText,
      statusCode,
      combined
    };
  };

  const logNonFieldError = (
    branch: "createUser" | "upsert" | "rpc" | "finalUpsert",
    err: unknown
  ) => {
    const meta = getErrorMeta(err);
    console.error(`[redeem][${branch}] unmapped_400`, {
      code: meta.codeText || null,
      status: meta.statusCode ?? null,
      message: meta.messageText || null,
      details: meta.detailsText || null,
      hint: meta.hintText || null,
      constraint: meta.constraintText || null
    });
  };

  const mapUserCorrectableError = (
    err: unknown
  ): { field: string; key: string; status?: number } | null => {
    const meta = getErrorMeta(err);
    const { codeText, statusCode, combined } = meta;

    // A) Prefer structured unique-violation metadata.
    if (codeText === "23505") {
      if (
        combined.includes("edu_username") ||
        combined.includes("education_username") ||
        combined.includes("edu_accounts_edu_username") ||
        combined.includes("edu accounts") ||
        combined.includes("edu_accounts")
      ) {
        return { field: "edu_username", key: "edu_username_exists", status: 409 };
      }
      if (
        combined.includes("personal_email") ||
        combined.includes("profiles_personal_email") ||
        combined.includes("profiles")
      ) {
        return { field: "personal_email", key: "personal_email_exists", status: 409 };
      }
      return null;
    }

    // B) Username already exists/taken.
    if (
      (combined.includes("edu username") || combined.includes("username")) &&
      (combined.includes("exists") || combined.includes("taken"))
    ) {
      return { field: "edu_username", key: "edu_username_exists", status: 409 };
    }

    // C) Invalid email.
    if (combined.includes("invalid email")) {
      return { field: "personal_email", key: "personal_email_invalid", status: statusCode ?? 400 };
    }

    // D) Weak/invalid password.
    if (
      combined.includes("password") &&
      (combined.includes("weak") || combined.includes("invalid") || combined.includes("least"))
    ) {
      return { field: "password", key: "password_invalid", status: statusCode ?? 400 };
    }

    // E) Activation code hints.
    if (combined.includes("activation") && combined.includes("not found")) {
      return { field: "activation_code", key: "activation_code_not_found", status: 404 };
    }
    if (
      combined.includes("activation") &&
      (combined.includes("invalid") || combined.includes("used") || combined.includes("expired"))
    ) {
      return { field: "activation_code", key: "activation_code_used", status: 409 };
    }
    if ((codeText === "P0001" || codeText === "22023") && combined.includes("activation")) {
      return { field: "activation_code", key: "activation_code_used", status: 409 };
    }

    return null;
  };

  try {
    try {
      getSupabaseServiceEnv();
      getSessionEnv();
    } catch (error) {
      return jsonError(message("missingEnv"), 500, { detail: safeString(error) });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonFieldError("activation_code", "activation_code_required", 400);
    }

    const activation_code = safeTrim(body.activation_code);
    const personal_email = safeTrim(body.personal_email);
    const edu_username = safeTrim(body.edu_username);
    const password = safeTrim(body.password);

    if (!activation_code) {
      return jsonFieldError("activation_code", "activation_code_required", 400);
    }
    if (!personal_email) {
      return jsonFieldError("personal_email", "personal_email_required", 400);
    }

    const normalizedPersonalEmail = safeTrimLower(personal_email);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedPersonalEmail)) {
      return jsonFieldError("personal_email", "personal_email_invalid", 400);
    }

    if (!edu_username) {
      return jsonFieldError("edu_username", "edu_username_required", 400);
    }
    const normalizedEduUsername = safeTrimLower(edu_username);
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(normalizedEduUsername)) {
      return jsonFieldError("edu_username", "edu_username_invalid", 400);
    }

    if (!password) {
      return jsonFieldError("password", "password_required", 400);
    }
    const passwordOk =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);
    if (!passwordOk) {
      return jsonFieldError("password", "password_invalid", 400);
    }

    if (isBlockedPersonalEmail(normalizedPersonalEmail)) {
      return jsonFieldError("personal_email", "personal_email_disallowed_domain", 400);
    }

    const supabase = createServerSupabaseClient();
    const authAdmin = supabase.auth.admin;

    // 1) Activation code must exist and be unused.
    const { data: codeRecord, error: codeError } = await supabase
      .from("activation_codes")
      .select("status")
      .eq("code", activation_code)
      .maybeSingle();

    if (codeError) {
      const errorMessage = codeError.message;
      if (isSchemaMissing(errorMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations"
        });
      }
      return jsonError(errorMessage, 500);
    }
    if (!codeRecord) {
      return jsonFieldError("activation_code", "activation_code_not_found", 404);
    }
    if (codeRecord.status !== "unused") {
      return jsonFieldError("activation_code", "activation_code_used", 409);
    }

    // 2) Personal email and edu username must be unique in our "official" tables.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("personal_email", normalizedPersonalEmail)
      .maybeSingle();
    if (existingProfile?.id) {
      return jsonFieldError("personal_email", "personal_email_exists", 409);
    }

    const { data: existingEduUsername } = await supabase
      .from("edu_accounts")
      .select("id")
      .eq("edu_username", normalizedEduUsername)
      .maybeSingle();
    if (existingEduUsername?.id) {
      return jsonFieldError("edu_username", "edu_username_exists", 409);
    }

    // Roll back only the data created in THIS request (by createdUserId).
    const rollbackCreatedUserData = async (createdUserId: string) => {
      let rollbackError: string | null = null;

      const appendRollbackError = (scope: string, err: unknown) => {
        const detail = safeString(err);
        rollbackError = rollbackError ? `${rollbackError}; ${scope}: ${detail}` : `${scope}: ${detail}`;
      };

      const deleteByUserId = async (table: string, column = "id") => {
        const { error } = await supabase.from(table).delete().eq(column, createdUserId);
        if (error) appendRollbackError(`delete ${table}`, error.message);
      };

      await deleteByUserId("user_mailboxes", "owner_user_id");
      await deleteByUserId("edu_accounts");
      await deleteByUserId("profiles");

      // Guard: only reset the activation code if it was used by THIS created user.
      const { error: codeRollbackError } = await supabase
        .from("activation_codes")
        .update({ status: "unused", used_at: null, used_by_user_id: null })
        .eq("code", activation_code)
        .eq("used_by_user_id", createdUserId);

      if (codeRollbackError) appendRollbackError("reset activation_code", codeRollbackError.message);

      const { error: authDeleteError } = await authAdmin.deleteUser(createdUserId);
      if (authDeleteError) appendRollbackError("delete auth user", authDeleteError.message);

      // Best-effort audit log; if this fails we still return rollbackError.
      const { error: auditErr } = await supabase.from("audit_logs").insert({
        user_id: createdUserId,
        action: "redeem_rollback",
        meta: rollbackError ? { error: rollbackError } : { ok: true }
      });
      if (auditErr) appendRollbackError("insert audit_logs", auditErr.message);

      return rollbackError;
    };

    // 3) Create auth user (may create "half product" if later steps fail -> must rollback).
    const created = await authAdmin.createUser({
      email: normalizedPersonalEmail,
      password,
      email_confirm: true
    });

    if (created.error || !created.data.user) {
      const errorMessage = created.error?.message ?? "Failed to create user";

      if (/already registered/i.test(errorMessage)) {
        return jsonFieldError("personal_email", "personal_email_exists", 409);
      }
      if (isSchemaMissing(errorMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations"
        });
      }

      const mappedCreateError = mapUserCorrectableError(created.error ?? errorMessage);
      if (mappedCreateError) {
        return jsonFieldError(
          mappedCreateError.field,
          mappedCreateError.key,
          mappedCreateError.status ?? 400
        );
      }

      logNonFieldError("createUser", created.error ?? errorMessage);
      return jsonError(errorMessage, 400);
    }

    const authUserId = created.data.user.id;

    // 4) Upsert initial profile
    const upsert = await supabase.from("profiles").upsert(
      { id: authUserId, personal_email: normalizedPersonalEmail, is_suspended: false },
      { onConflict: "id" }
    );

    if (upsert.error) {
      const errorMessage = upsert.error.message;
      const rollbackError = await rollbackCreatedUserData(authUserId);

      if (isSchemaMissing(errorMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations",
          rollback_error: rollbackError ?? undefined
        });
      }

      const mappedUpsertError = mapUserCorrectableError(upsert.error ?? errorMessage);
      if (mappedUpsertError) {
        return jsonFieldError(
          mappedUpsertError.field,
          mappedUpsertError.key,
          mappedUpsertError.status ?? 400
        );
      }

      logNonFieldError("upsert", upsert.error ?? errorMessage);
      return jsonError(errorMessage, 400, { rollback_error: rollbackError ?? undefined });
    }

    // 5) Redeem activation code via RPC (writes official DB rows)
    const { data, error } = await supabase.rpc("redeem_activation_code", {
      p_code: activation_code,
      p_user_id: authUserId,
      p_personal_email: normalizedPersonalEmail,
      p_edu_username: normalizedEduUsername
    });

    if (error || !data?.[0]) {
      const failureMessage = error?.message ?? message("redeemFailed");
      const rollbackError = await rollbackCreatedUserData(authUserId);

      if (isSchemaMissing(failureMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations",
          rollback_error: rollbackError ?? undefined
        });
      }

      const mappedRpcError = mapUserCorrectableError(error ?? failureMessage);
      if (mappedRpcError) {
        return jsonFieldError(
          mappedRpcError.field,
          mappedRpcError.key,
          mappedRpcError.status ?? 400
        );
      }

      logNonFieldError("rpc", error ?? failureMessage);
      return jsonError(failureMessage, 400, { rollback_error: rollbackError ?? undefined });
    }

    const result = data[0];

    // 6) Final profile upsert (redundant but keeps original behavior)
    const finalUpsert = await supabase.from("profiles").upsert(
      { id: authUserId, personal_email: normalizedPersonalEmail },
      { onConflict: "id" }
    );

    if (finalUpsert.error) {
      const errorMessage = finalUpsert.error.message;
      const rollbackError = await rollbackCreatedUserData(authUserId);

      if (isSchemaMissing(errorMessage)) {
        return jsonError(message("schemaMissing"), 500, {
          detail: "schema missing: run supabase/schema.sql + migrations",
          rollback_error: rollbackError ?? undefined
        });
      }

      const mappedFinalUpsertError = mapUserCorrectableError(finalUpsert.error ?? errorMessage);
      if (mappedFinalUpsertError) {
        return jsonFieldError(
          mappedFinalUpsertError.field,
          mappedFinalUpsertError.key,
          mappedFinalUpsertError.status ?? 400
        );
      }

      logNonFieldError("finalUpsert", finalUpsert.error ?? errorMessage);
      return jsonError(errorMessage, 400, { rollback_error: rollbackError ?? undefined });
    }

    // 7) Session + success
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

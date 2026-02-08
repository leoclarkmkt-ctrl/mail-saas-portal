import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminUserActionSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { randomString } from "@/lib/security/random";

export const runtime = "nodejs";

/**
 * GET /api/admin/users
 * - 搜索 personal_email / edu_email / edu_username
 * - 全链路只使用 profiles.user_id
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const query = request.nextUrl.searchParams.get("query")?.toLowerCase() ?? "";
  const supabase = createServerSupabaseClient();

  // 1) 从 profiles 里按 personal_email 找 user_id
  const userMatches = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("personal_email", `%${query}%`)
    .limit(100);

  const userIds = userMatches.data?.map((row) => row.user_id) ?? [];

  // 2) edu_accounts 查询（邮箱 / 用户名 / user_id）
  let eduQuery = supabase
    .from("edu_accounts")
    .select("user_id, edu_email, expires_at, status");

  const orFilters: string[] = [
    `edu_email.ilike.%${query}%,edu_username.ilike.%${query}%`
  ];

  if (userIds.length > 0) {
    orFilters.push(`user_id.in.(${userIds.join(",")})`);
  }

  eduQuery = eduQuery.or(orFilters.join(","));

  const { data: eduRows, error: eduError } = await eduQuery.limit(100);
  if (eduError) return jsonError(eduError.message, 400);

  const rows = eduRows ?? [];
  const eduUserIds = rows.map((r) => r.user_id).filter(Boolean);

  // 3) 回查 profiles（user_id → profile）
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, personal_email, is_suspended")
    .in("user_id", eduUserIds);

  if (profileError) return jsonError(profileError.message, 400);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  // 4) 拼装返回数据（不再返回 id，只返回 user_id）
  const result = rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      user_id: row.user_id,
      personal_email: profile?.personal_email ?? null,
      is_suspended: profile?.is_suspended ?? false,
      edu_email: row.edu_email,
      expires_at: row.expires_at,
      status: row.status
    };
  });

  return jsonSuccess({ users: result });
}

/**
 * PATCH /api/admin/users
 * - renew / suspend / reset password
 * - 全部基于 user_id
 */
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const lang = request.nextUrl.searchParams.get("lang") === "zh" ? "zh" : "en";
  const message = (key: string) => {
    const zh = {
      invalidInput: "提交内容无效",
      userNotFound: "未找到用户"
    };
    const en = {
      invalidInput: "Invalid input",
      userNotFound: "User not found"
    };
    const dict = lang === "zh" ? zh : en;
    return dict[key as keyof typeof dict] ?? dict.invalidInput;
  };

  const errorResponse = (code: string, msg: string, detail: unknown, status: number) =>
    NextResponse.json({ code, message: msg, detail }, { status });

  const body = await request.json();
  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_input", message("invalidInput"), null, 400);
  }

  const supabase = createServerSupabaseClient();

  // A) 管理员续期
  if (parsed.data.years) {
    const { error } = await supabase.rpc("admin_renew_user", {
      p_user_id: parsed.data.user_id,
      p_years: parsed.data.years
    });
    if (error) return jsonError(error.message, 400);

    await supabase.from("audit_logs").insert({
      action: "admin_renew_user",
      user_id: parsed.data.user_id,
      meta: { years: parsed.data.years }
    });

    return jsonSuccess({ ok: true });
  }

  // B) 冻结 / 解冻账号
  if (typeof parsed.data.suspend === "boolean") {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_suspended: parsed.data.suspend,
        suspended_reason: parsed.data.reason ?? null
      })
      .eq("user_id", parsed.data.user_id);

    if (error) return jsonError(error.message, 400);

    await supabase.from("audit_logs").insert({
      action: parsed.data.suspend ? "admin_suspend_user" : "admin_unsuspend_user",
      user_id: parsed.data.user_id
    });

    return jsonSuccess({ ok: true });
  }

  // C) 管理员重置密码
  if (parsed.data.reset_password) {
    const tempPassword = `NSUK-${randomString(
      8,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"
    )}!`;

    const update = await supabase.auth.admin.updateUserById(
      parsed.data.user_id,
      { password: tempPassword }
    );

    if (update.error) return jsonError(update.error.message, 400);

    await supabase.from("audit_logs").insert({
      action: "admin_reset_password",
      user_id: parsed.data.user_id
    });

    return jsonSuccess({ temp_password: tempPassword });
  }

  return jsonError("No action", 400);
}

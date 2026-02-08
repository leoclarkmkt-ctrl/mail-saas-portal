import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminUserActionSchema } from "@/lib/validation/schemas";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { randomString } from "@/lib/security/random";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const query = request.nextUrl.searchParams.get("query")?.toLowerCase() ?? "";
  const supabase = createServerSupabaseClient();
  const userMatches = await supabase
    .from("profiles")
    .select("id")
    .ilike("personal_email", `%${query}%`)
    .limit(100);

  const userIds = userMatches.data?.map((row) => row.id) ?? [];

  let eduQuery = supabase
    .from("edu_accounts")
    .select("user_id, edu_email, expires_at, status");
  const orFilters = [`edu_email.ilike.%${query}%,edu_username.ilike.%${query}%`];
  if (userIds.length > 0) {
    orFilters.push(`user_id.in.(${userIds.join(",")})`);
  }
  if (orFilters.length > 0) {
    eduQuery = eduQuery.or(orFilters.join(","));
  }
  const { data, error } = await eduQuery.limit(100);
  if (error) return jsonError(error.message, 400);
  const eduRows = data ?? [];
  const eduUserIds = eduRows.map((row) => row.user_id).filter(Boolean);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, personal_email, is_suspended")
    .in("id", eduUserIds);
  if (profileError) return jsonError(profileError.message, 400);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const rows = eduRows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.user_id ?? null,
      user_id: row.user_id ?? null,
      personal_email: profile?.personal_email ?? null,
      is_suspended: profile?.is_suspended ?? false,
      edu_email: row.edu_email,
      expires_at: row.expires_at,
      status: row.status
    };
  });
  return jsonSuccess({ users: rows });
}

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
  if (!parsed.success) return errorResponse("invalid_input", message("invalidInput"), null, 400);

  const supabase = createServerSupabaseClient();
  if (parsed.data.years) {
    const { error } = await supabase.rpc("admin_renew_user", {
      p_user_id: parsed.data.user_id,
      p_years: parsed.data.years
    });
    if (error) return jsonError(error.message, 400);
    await supabase.from("audit_logs").insert({ action: "admin_renew_user", user_id: parsed.data.user_id, meta: { years: parsed.data.years } });
    return jsonSuccess({ ok: true });
  }

  if (typeof parsed.data.suspend === "boolean") {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: parsed.data.suspend, suspended_reason: parsed.data.reason ?? null })
      .eq("id", parsed.data.user_id);
    if (error) return jsonError(error.message, 400);
    await supabase.from("audit_logs").insert({ action: parsed.data.suspend ? "admin_suspend_user" : "admin_unsuspend_user", user_id: parsed.data.user_id });
    return jsonSuccess({ ok: true });
  }

  if (parsed.data.reset_password) {
    const tempPassword = `NSUK-${randomString(8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789")}!`;
    const update = await supabase.auth.admin.updateUserById(parsed.data.user_id, {
      password: tempPassword
    });
    if (update.error) return jsonError(update.error.message, 400);
    await supabase
      .from("audit_logs")
      .insert({ action: "admin_reset_password", user_id: parsed.data.user_id });
    return jsonSuccess({ temp_password: tempPassword });
  }

  return jsonError("No action", 400);
}

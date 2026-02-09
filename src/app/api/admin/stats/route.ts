import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

type DebugErr = { message: string; code?: string };

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const last24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last5mIso = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  const warnings: string[] = [];
  const debugErrors: Record<string, DebugErr> = {};

  // 1) Activation codes
  let activationCodes = { unused: 0, used: 0, revoked: 0 };
  try {
    const unusedCodes = await supabase
      .from("activation_codes")
      .select("code", { count: "exact", head: true })
      .eq("status", "unused");
    if (unusedCodes.error) throw unusedCodes.error;

    const usedCodes = await supabase
      .from("activation_codes")
      .select("code", { count: "exact", head: true })
      .eq("status", "used");
    if (usedCodes.error) throw usedCodes.error;

    const revokedCodes = await supabase
      .from("activation_codes")
      .select("code", { count: "exact", head: true })
      .eq("status", "revoked");
    if (revokedCodes.error) throw revokedCodes.error;

    activationCodes = {
      unused: unusedCodes.count ?? 0,
      used: usedCodes.count ?? 0,
      revoked: revokedCodes.count ?? 0
    };
  } catch (error) {
    warnings.push("activation_codes");
    const err = error as { message?: string; code?: string };
    debugErrors.activation_codes = {
      message: err.message ?? "Unknown activation_codes error",
      code: err.code
    };
  }

  // 2) Users total (profiles)
  let users = { total: 0 };
  try {
    // IMPORTANT: profiles primary key is user_id (not id)
    const totalUsers = await supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true });
    if (totalUsers.error) throw totalUsers.error;

    users = { total: totalUsers.count ?? 0 };
  } catch (error) {
    warnings.push("profiles");
    const err = error as { message?: string; code?: string };
    debugErrors.profiles = {
      message: err.message ?? "Unknown profiles error",
      code: err.code
    };
  }

  // 3) Edu accounts (mailboxes)
  let mailboxes = { active: 0, expired: 0 };
  try {
    const activeEdu = await supabase
      .from("edu_accounts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso);
    if (activeEdu.error) throw activeEdu.error;

    const expiredEdu = await supabase
      .from("edu_accounts")
      .select("id", { count: "exact", head: true })
      // treat expires_at is null as expired for safety
      .or(`status.eq.expired,expires_at.lte.${nowIso},expires_at.is.null`);
    if (expiredEdu.error) throw expiredEdu.error;

    mailboxes = {
      active: activeEdu.count ?? 0,
      expired: expiredEdu.count ?? 0
    };
  } catch (error) {
    warnings.push("edu_accounts");
    const err = error as { message?: string; code?: string };
    debugErrors.edu_accounts = {
      message: err.message ?? "Unknown edu_accounts error",
      code: err.code
    };
  }

  // 4) Last 24h audit stats
  let last24h = { redeemed: 0, logins: 0 };
  try {
    const redeems24h = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "user_redeem")
      .gte("created_at", last24hIso);
    if (redeems24h.error) throw redeems24h.error;

    const logins24h = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", ["user_login_personal", "user_login_edu"])
      .gte("created_at", last24hIso);
    if (logins24h.error) throw logins24h.error;

    last24h = {
      redeemed: redeems24h.count ?? 0,
      logins: logins24h.count ?? 0
    };
  } catch (error) {
    warnings.push("audit_logs");
    const err = error as { message?: string; code?: string };
    debugErrors.audit_logs = {
      message: err.message ?? "Unknown audit_logs error",
      code: err.code
    };
  }

  // 5) Presence stats
  let presence = { online5m: 0, active24h: 0 };
  try {
    const online5m = await supabase
      .from("user_presence")
      .select("user_id", { count: "exact", head: true })
      .gte("last_seen_at", last5mIso);
    if (online5m.error) throw online5m.error;

    const active24h = await supabase
      .from("user_presence")
      .select("user_id", { count: "exact", head: true })
      .gte("last_seen_at", last24hIso);
    if (active24h.error) throw active24h.error;

    presence = {
      online5m: online5m.count ?? 0,
      active24h: active24h.count ?? 0
    };
  } catch (error) {
    warnings.push("user_presence");
    const err = error as { message?: string; code?: string };
    debugErrors.user_presence = {
      message: err.message ?? "Unknown user_presence error",
      code: err.code
    };
  }

  return jsonSuccess({
    ok: true,
    data: {
      activationCodes,
      users,
      mailboxes,
      last24h,
      presence
    },
    warnings,
    debugErrors
  });
}

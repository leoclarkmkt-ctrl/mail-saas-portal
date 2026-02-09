import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

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

  const [
    unusedCodes,
    usedCodes,
    revokedCodes,
    activeEdu,
    expiredEdu,
    redeems24h,
    logins24h,
    online5m,
    active24h,
    totalUsers
  ] = await Promise.all([
    supabase.from("activation_codes").select("code", { count: "exact", head: true }).eq("status", "unused"),
    supabase.from("activation_codes").select("code", { count: "exact", head: true }).eq("status", "used"),
    supabase.from("activation_codes").select("code", { count: "exact", head: true }).eq("status", "revoked"),
    supabase
      .from("edu_accounts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso),
    supabase
      .from("edu_accounts")
      .select("id", { count: "exact", head: true })
      .or(`status.eq.expired,expires_at.lte.${nowIso},expires_at.is.null`),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "user_redeem")
      .gte("created_at", last24hIso),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", ["user_login_personal", "user_login_edu"])
      .gte("created_at", last24hIso),
    supabase
      .from("user_presence")
      .select("user_id", { count: "exact", head: true })
      .gte("last_seen_at", last5mIso),
    supabase
      .from("user_presence")
      .select("user_id", { count: "exact", head: true })
      .gte("last_seen_at", last24hIso),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);

  const errors = [
    unusedCodes.error,
    usedCodes.error,
    revokedCodes.error,
    activeEdu.error,
    expiredEdu.error,
    redeems24h.error,
    logins24h.error,
    online5m.error,
    active24h.error,
    totalUsers.error
  ].filter(Boolean);

  if (errors.length > 0) {
    return jsonError(errors[0]?.message ?? "Failed to load admin stats", 500);
  }

  return jsonSuccess({
    ok: true,
    data: {
      activationCodes: {
        unused: unusedCodes.count ?? 0,
        used: usedCodes.count ?? 0,
        revoked: revokedCodes.count ?? 0
      },
      users: {
        total: totalUsers.count ?? 0
      },
      mailboxes: {
        active: activeEdu.count ?? 0,
        expired: expiredEdu.count ?? 0
      },
      last24h: {
        redeemed: redeems24h.count ?? 0,
        logins: logins24h.count ?? 0
      },
      presence: {
        online5m: online5m.count ?? 0,
        active24h: active24h.count ?? 0
      }
    }
  });
}

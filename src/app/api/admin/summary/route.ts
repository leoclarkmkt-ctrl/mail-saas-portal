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
  const { data: codeCounts } = await supabase.rpc("admin_code_counts");
  const { count: userCount } = await supabase.from("users").select("id", { count: "exact", head: true });
  const { data: eduCounts } = await supabase.rpc("admin_edu_counts");
  const { data: activity } = await supabase.rpc("admin_activity_counts");

  return jsonSuccess({
    codes: codeCounts ?? { unused: 0, used: 0, revoked: 0 },
    users: { total: userCount ?? 0 },
    edu: eduCounts ?? { active: 0, expired: 0 },
    activity: activity ?? { redeems: 0, logins: 0 }
  });
}

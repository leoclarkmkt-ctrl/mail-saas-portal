import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const escapedQuery = query.replace(/[%_]/g, "\\$&");
  const supabase = createServerSupabaseClient();
  if (!query) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, user_id, action, ip, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return jsonError(error.message, 500);
    return jsonSuccess({ ok: true, data: data ?? [] });
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, ip, created_at")
    .or(`action.ilike.%${escapedQuery}%,ip.ilike.%${escapedQuery}%,user_id::text.ilike.%${escapedQuery}%`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return jsonError(error.message, 500);
  return jsonSuccess({ ok: true, data: data ?? [] });
}

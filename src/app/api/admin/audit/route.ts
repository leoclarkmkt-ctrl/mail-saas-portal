import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  const query = request.nextUrl.searchParams.get("query")?.toLowerCase() ?? "";
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, ip, created_at")
    .or(`action.ilike.%${query}%,user_id.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return jsonError(error.message, 400);
  return jsonSuccess({ logs: data ?? [] });
}

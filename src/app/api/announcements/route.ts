import { NextRequest } from "next/server";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 5, 1), 20);

  const supabase = createServerSupabaseAnonClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,excerpt,content_json,published_at,sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return jsonError(error.message, 500);

  return jsonSuccess({ ok: true, data: data ?? [] });
}

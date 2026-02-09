import { NextRequest } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().max(280).optional().nullable(),
  content_json: z.unknown().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const queryValue = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const escapedQuery = queryValue.replace(/[%_]/g, "\\$&");
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("pageSize") ?? 10), 1), 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("announcements")
    .select("id,title,excerpt,content_json,is_published,published_at,sort_order,created_at,updated_at", { count: "exact" })
    .order("sort_order", { ascending: false })
    .order("is_published", { ascending: false })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (status === "published") {
    query = query.eq("is_published", true);
  } else if (status === "draft") {
    query = query.eq("is_published", false);
  }

  if (queryValue) {
    query = query.or(`title.ilike.%${escapedQuery}%,excerpt.ilike.%${escapedQuery}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) return jsonError(error.message, 500);

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const statsMap = new Map<string, { views_total: number; views_24h: number; unique_users_total: number; uniqueUsers: Set<string> }>();
  ids.forEach((id) => {
    statsMap.set(id, { views_total: 0, views_24h: 0, unique_users_total: 0, uniqueUsers: new Set() });
  });

  if (ids.length > 0) {
    const { data: viewRows, error: viewError } = await supabase
      .from("announcement_views")
      .select("announcement_id,user_id,created_at")
      .in("announcement_id", ids);

    if (viewError) return jsonError(viewError.message, 500);

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    viewRows?.forEach((view) => {
      const entry = statsMap.get(view.announcement_id);
      if (!entry) return;
      entry.views_total += 1;
      if (new Date(view.created_at).getTime() >= cutoff) {
        entry.views_24h += 1;
      }
      if (view.user_id) {
        entry.uniqueUsers.add(view.user_id);
      }
    });
  }

  const enriched = rows.map((row) => {
    const stats = statsMap.get(row.id);
    return {
      ...row,
      stats: {
        views_total: stats?.views_total ?? 0,
        views_24h: stats?.views_24h ?? 0,
        unique_users_total: stats?.uniqueUsers.size ?? 0
      }
    };
  });

  return jsonSuccess({ ok: true, data: enriched, total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const isPublished = parsed.data.is_published ?? false;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: parsed.data.title,
      excerpt: parsed.data.excerpt ?? null,
      content_json: parsed.data.content_json ?? {},
      is_published: isPublished,
      published_at: isPublished ? now : null,
      sort_order: parsed.data.sort_order ?? 0,
      updated_at: now
    })
    .select("id,title,excerpt,content_json,is_published,published_at,sort_order,created_at,updated_at")
    .single();

  if (error) return jsonError(error.message, 400);

  return jsonSuccess({ ok: true, data });
}

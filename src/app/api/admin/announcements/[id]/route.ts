import { NextRequest } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  excerpt: z.string().max(280).optional().nullable(),
  content_json: z.unknown().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,excerpt,content_json,is_published,published_at,sort_order,created_at,updated_at")
    .eq("id", params.id)
    .single();

  if (error) return jsonError(error.message, 404);

  return jsonSuccess({ ok: true, data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = updateAnnouncementSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("announcements")
    .select("is_published,published_at")
    .eq("id", params.id)
    .single();

  if (existingError) return jsonError(existingError.message, 404);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    updated_at: now
  };

  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.excerpt !== undefined) updates.excerpt = parsed.data.excerpt ?? null;
  if (parsed.data.content_json !== undefined) updates.content_json = parsed.data.content_json;
  if (parsed.data.sort_order !== undefined) updates.sort_order = parsed.data.sort_order;

  if (parsed.data.is_published !== undefined) {
    updates.is_published = parsed.data.is_published;
    if (!existing?.is_published && parsed.data.is_published && !existing?.published_at) {
      updates.published_at = now;
    }
  }

  const { data, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", params.id)
    .select("id,title,excerpt,content_json,is_published,published_at,sort_order,created_at,updated_at")
    .single();

  if (error) return jsonError(error.message, 400);

  return jsonSuccess({ ok: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", params.id);

  if (error) return jsonError(error.message, 400);

  return jsonSuccess({ ok: true });
}

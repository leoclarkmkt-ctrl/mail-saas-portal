import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { getUserSession } from "@/lib/auth/user-session";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

const viewSchema = z.object({
  announcementId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = viewSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const supabase = createServerSupabaseAnonClient();
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select("id")
    .eq("id", parsed.data.announcementId)
    .eq("is_published", true)
    .single();

  if (error || !announcement) return jsonError("Announcement not found", 404);

  const session = await getUserSession();

  const { error: insertError } = await supabase
    .from("announcement_views")
    .insert({
      announcement_id: parsed.data.announcementId,
      user_id: session?.userId ?? null
    });

  if (insertError) return jsonError(insertError.message, 500);

  return jsonSuccess({ ok: true });
}

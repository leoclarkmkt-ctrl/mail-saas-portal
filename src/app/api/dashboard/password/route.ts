import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserSession } from "@/lib/auth/user-session";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }
  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", session.userId)
    .single();
  if (error || !data) {
    return jsonError("User not found", 404);
  }
  const ok = await bcrypt.compare(parsed.data.old_password, data.password_hash);
  if (!ok) {
    return jsonError("Invalid password", 403);
  }
  const password_hash = await bcrypt.hash(parsed.data.new_password, 10);
  await supabase.from("users").update({ password_hash }).eq("id", session.userId);
  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_password_change"
  });
  return jsonSuccess({ ok: true });
}

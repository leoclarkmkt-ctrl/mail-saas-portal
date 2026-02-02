import { NextRequest } from "next/server";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { getUserSession } from "@/lib/auth/user-session";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  getServerEnv();
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
  const authClient = createServerSupabaseAnonClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("personal_email")
    .eq("id", session.userId)
    .single();
  if (error || !data) {
    return jsonError("User not found", 404);
  }
  const signIn = await authClient.auth.signInWithPassword({
    email: data.personal_email,
    password: parsed.data.old_password
  });
  if (signIn.error) {
    return jsonError("Invalid password", 403);
  }
  const update = await supabase.auth.admin.updateUserById(session.userId, {
    password: parsed.data.new_password
  });
  if (update.error) {
    return jsonError(update.error.message ?? "Update failed", 400);
  }
  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_password_change"
  });
  return jsonSuccess({ ok: true });
}

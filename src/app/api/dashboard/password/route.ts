import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation/schemas";
import {
  createServerSupabaseAnonClient,
  createServerSupabaseClient
} from "@/lib/supabase/server";
import { getSessionEnv } from "@/lib/env";
import { clearUserSession, requireUserSession } from "@/lib/auth/user-session";
import { jsonSuccess } from "@/lib/utils/api";
import { getClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Ensure required envs (SESSION_SECRET, etc.)
  getSessionEnv();

  const errorResponse = (key: string, status: number) =>
    NextResponse.json({ ok: false, error: { key } }, { status });

  // Must be logged in
  const session = await requireUserSession();
  if (!session) {
    return errorResponse("unauthorized", 401);
  }

  // Validate input
  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_input", 400);
  }

  const supabase = createServerSupabaseClient();
  const authClient = createServerSupabaseAnonClient();
  const clientIp = getClientIp(request);

  // 🔒 Schema-aligned lookup: profiles.user_id === auth.users.id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("personal_email, is_suspended, user_id")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (profileError) {
    console.error("[dashboard][password] profile_lookup_failed", profileError);
    return errorResponse("internal_error", 500);
  }
  if (!profile) {
    return errorResponse("user_not_found", 404);
  }

  if (profile.is_suspended) {
    clearUserSession();
    return errorResponse("account_suspended", 403);
  }

  // Verify old password via personal email
  const signIn = await authClient.auth.signInWithPassword({
    email: profile.personal_email,
    password: parsed.data.old_password
  });

  if (signIn.error) {
    console.error("[dashboard][password] invalid_password", signIn.error);
    return errorResponse("invalid_password", 403);
  }

  // Update password (admin API)
  const update = await supabase.auth.admin.updateUserById(session.userId, {
    password: parsed.data.new_password
  });

  if (update.error) {
    console.error("[dashboard][password] update_failed", update.error);
    return errorResponse("update_failed", 400);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_password_change",
    ip: clientIp
  });

  return jsonSuccess({ ok: true });
}

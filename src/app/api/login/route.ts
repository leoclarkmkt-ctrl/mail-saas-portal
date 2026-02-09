import { NextRequest } from "next/server";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionEnv } from "@/lib/env";
import { jsonFieldError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeTrim, safeTrimLower } from "@/lib/safe-trim";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  /**
   * Error keys:
   * - login_personal_email_required
   * - login_personal_email_not_found
   * - login_personal_password_required
   * - login_personal_password_invalid
   * - login_edu_email_required
   * - login_edu_email_not_found
   * - login_edu_password_required
   * - login_edu_password_invalid
   * - login_edu_academic_year_not_registered
   */
  const rateLimitResponse = await enforceRateLimit(request, "login", {
    requests: 5,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;

  getSessionEnv();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonFieldError("email", "login_personal_email_required", 400);
  }

  const email = safeTrimLower(body.email);
  const password = safeTrim(body.password);
  const mode = body.mode === "edu" ? "edu" : "personal";
  const source = body.source === "edu-mail" ? "edu-mail" : undefined;

  if (!email) {
    return jsonFieldError(
      "email",
      mode === "personal" ? "login_personal_email_required" : "login_edu_email_required",
      400
    );
  }

  if (!password) {
    return jsonFieldError(
      "password",
      mode === "personal" ? "login_personal_password_required" : "login_edu_password_required",
      400
    );
  }

  const supabase = createServerSupabaseClient();
  const authClient = createServerSupabaseAnonClient();

  if (mode === "personal") {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("personal_email", email)
      .single();

    if (error || !data) {
      return jsonFieldError("email", "login_personal_email_not_found", 404);
    }

    if (data.is_suspended) {
      return jsonFieldError("email", "unknown", 401);
    }

    const signIn = await authClient.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      return jsonFieldError("password", "login_personal_password_invalid", 401);
    }

    const userId = signIn.data.user?.id;
    if (!userId) {
      return jsonFieldError("email", "unknown", 401);
    }

    await createUserSession({ userId, mode: "personal" });

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "user_login_personal"
    });

    return jsonSuccess({ ok: true });
  }

  const { data, error } = await supabase
    .from("edu_accounts")
    .select("id, edu_email, expires_at, status, user_id")
    .eq("edu_email", email)
    .single();

  if (error || !data) {
    return jsonFieldError("email", "login_edu_email_not_found", 404);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("personal_email, is_suspended")
    .eq("user_id", data.user_id)
    .single();

  if (profileError || !profile) {
    return jsonFieldError("email", "login_edu_email_not_found", 404);
  }

  if (profile.is_suspended) {
    return jsonFieldError("email", "unknown", 401);
  }

  const signIn = await authClient.auth.signInWithPassword({
    email: profile.personal_email,
    password
  });

  if (signIn.error) {
    return jsonFieldError("password", "login_edu_password_invalid", 401);
  }

  const expired = new Date(data.expires_at) <= new Date();
  const inactive = data.status !== "active";

  if (expired || inactive) {
    if (expired && data.status !== "expired") {
      await supabase.from("edu_accounts").update({ status: "expired" }).eq("id", data.id);
    }
    return jsonFieldError("email", "login_edu_academic_year_not_registered", 401);
  }

  const sessionMode = source === "edu-mail" ? "edu" : "personal";
  await createUserSession({ userId: data.user_id, mode: sessionMode });

  await supabase.from("audit_logs").insert({
    user_id: data.user_id,
    action: "user_login_edu"
  });

  return jsonSuccess({ ok: true });
}

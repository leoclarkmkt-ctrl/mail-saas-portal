import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(request, "login", {
    requests: 5,
    windowSeconds: 60
  });
  if (rateLimitResponse) return rateLimitResponse;
  getSessionEnv();
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }
  const { email, password, mode } = parsed.data;
  const supabase = createServerSupabaseClient();
  const authClient = createServerSupabaseAnonClient();

  if (mode === "personal") {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, is_suspended")
      .eq("personal_email", email)
      .single();
    if (error || !data) {
      return jsonError("Invalid credentials", 401);
    }
    if (data.is_suspended) {
      return jsonError("Account suspended", 403);
    }
    const signIn = await authClient.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      return jsonError("Invalid credentials", 401);
    }
    await createUserSession({ userId: data.user_id, mode: "personal" });
    await supabase.from("audit_logs").insert({
      user_id: data.user_id,
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
    return jsonError("Invalid credentials", 401);
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, personal_email, is_suspended")
    .eq("user_id", data.user_id)
    .single();
  if (profileError || !profile) {
    return jsonError("Invalid credentials", 401);
  }
  if (profile.is_suspended) {
    return jsonError("Account suspended", 403);
  }
  const signIn = await authClient.auth.signInWithPassword({
    email: profile.personal_email,
    password
  });
  if (signIn.error) {
    return jsonError("Invalid credentials", 401);
  }
  const expired = new Date(data.expires_at) <= new Date();
  if (expired) {
    await supabase.from("edu_accounts").update({ status: "expired" }).eq("id", data.id);
    return jsonError("Account expired", 403);
  }
  await createUserSession({ userId: data.user_id, mode: "edu" });
  await supabase.from("audit_logs").insert({
    user_id: data.user_id,
    action: "user_login_edu"
  });
  return jsonSuccess({ ok: true });
}

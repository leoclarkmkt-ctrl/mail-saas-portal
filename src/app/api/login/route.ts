import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }
  const { email, password, mode } = parsed.data;
  const supabase = createServerSupabaseClient();

  if (mode === "personal") {
    const { data, error } = await supabase
      .from("users")
      .select("id, password_hash, is_suspended")
      .eq("personal_email", email)
      .single();
    if (error || !data) {
      return jsonError("Invalid credentials", 401);
    }
    if (data.is_suspended) {
      return jsonError("Account suspended", 403);
    }
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) {
      return jsonError("Invalid credentials", 401);
    }
    await createUserSession({ userId: data.id, mode: "personal" });
    await supabase.from("audit_logs").insert({
      user_id: data.id,
      action: "user_login_personal"
    });
    return jsonSuccess({ ok: true });
  }

  const { data, error } = await supabase
    .from("edu_accounts")
    .select("id, edu_email, expires_at, status, user_id, users(password_hash, is_suspended)")
    .eq("edu_email", email)
    .single();

  if (error || !data) {
    return jsonError("Invalid credentials", 401);
  }
  const user = data.users;
  if (!user || user.is_suspended) {
    return jsonError("Account suspended", 403);
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
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

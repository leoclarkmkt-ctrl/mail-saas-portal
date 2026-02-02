import { NextRequest } from "next/server";
import { redeemSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  getServerEnv();
  const body = await request.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const { activation_code, personal_email, edu_username, password } = parsed.data;
  const supabase = createServerSupabaseClient();
  const authAdmin = supabase.auth.admin;

  let authUserId: string;
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("personal_email", personal_email)
    .maybeSingle();
  if (existingProfile?.user_id) {
    authUserId = existingProfile.user_id;
    const update = await authAdmin.updateUserById(authUserId, { password });
    if (update.error) {
      return jsonError(update.error.message ?? "Failed to update password", 400);
    }
  } else {
    const created = await authAdmin.createUser({
      email: personal_email,
      password,
      email_confirm: true
    });
    if (created.error || !created.data.user) {
      return jsonError(created.error?.message ?? "Failed to create user", 400);
    }
    authUserId = created.data.user.id;
    await supabase.from("profiles").upsert(
      { id: authUserId, user_id: authUserId, personal_email, is_suspended: false },
      { onConflict: "user_id" }
    );
  }

  const { data, error } = await supabase.rpc("redeem_activation_code", {
    p_code: activation_code,
    p_user_id: authUserId,
    p_personal_email: personal_email,
    p_edu_username: edu_username
  });

  if (error || !data?.[0]) {
    return jsonError(error?.message ?? "Redeem failed", 400);
  }

  const result = data[0];
  await supabase.from("profiles").upsert(
    { id: authUserId, user_id: authUserId, personal_email },
    { onConflict: "user_id" }
  );
  await createUserSession({ userId: result.user_id, mode: "personal" });

  return jsonSuccess({
    personal_email: result.personal_email,
    edu_email: result.edu_email,
    expires_at: result.expires_at,
    password,
    webmail: "https://mail.nsuk.edu.kg/"
  });
}

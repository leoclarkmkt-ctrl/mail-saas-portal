import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { redeemSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";
import { createUserSession } from "@/lib/auth/user-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const { activation_code, personal_email, edu_username, password } = parsed.data;
  const supabase = createServerSupabaseClient();
  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.rpc("redeem_activation_code", {
    p_code: activation_code,
    p_personal_email: personal_email,
    p_edu_username: edu_username,
    p_password_hash: password_hash
  });

  if (error || !data?.[0]) {
    return jsonError(error?.message ?? "Redeem failed", 400);
  }

  const result = data[0];
  await createUserSession({ userId: result.user_id, mode: "personal" });

  return jsonSuccess({
    personal_email: result.personal_email,
    edu_email: result.edu_email,
    expires_at: result.expires_at,
    password,
    webmail: "https://mail.nsuk.edu.kg/"
  });
}

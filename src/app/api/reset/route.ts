import { NextRequest } from "next/server";
import { resetSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const supabase = createServerSupabaseClient();
  const authed = createServerSupabaseAnonClient();
  await authed.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: ""
  });
  const { error } = await authed.auth.updateUser({ password: parsed.data.new_password });
  if (error) {
    return jsonError(error.message ?? "Reset failed", 400);
  }
  const user = await authed.auth.getUser();
  if (user.data.user) {
    await supabase.from("audit_logs").insert({
      user_id: user.data.user.id,
      action: "user_password_reset"
    });
  }

  return jsonSuccess({ ok: true });
}

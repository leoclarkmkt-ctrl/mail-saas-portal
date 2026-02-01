import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { resetSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) {
    return jsonError("Invalid token", 400);
  }
  if (data.used_at) {
    return jsonError("Token used", 400);
  }
  if (new Date(data.expires_at) <= new Date()) {
    return jsonError("Token expired", 400);
  }

  const password_hash = await bcrypt.hash(parsed.data.new_password, 10);
  await supabase.from("users").update({ password_hash }).eq("id", data.user_id);
  await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  await supabase.from("audit_logs").insert({
    user_id: data.user_id,
    action: "user_password_reset"
  });

  return jsonSuccess({ ok: true });
}

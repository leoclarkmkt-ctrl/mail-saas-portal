import { NextRequest } from "next/server";
import crypto from "crypto";
import { forgotSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/utils/api";
import { sendResetEmail } from "@/lib/email/mailer";
import { getLocale } from "@/i18n";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ ok: true });
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id, personal_email")
    .eq("personal_email", parsed.data.personal_email)
    .single();

  if (data) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from("password_reset_tokens").insert({
      user_id: data.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const link = `${baseUrl}/reset?token=${token}`;

    try {
      await sendResetEmail({ to: data.personal_email, resetLink: link, locale: getLocale() });
    } catch {
      console.info("Password reset link:", link);
    }
  }

  return jsonSuccess({ ok: true });
}

import { NextRequest } from "next/server";
import { forgotSchema } from "@/lib/validation/schemas";
import { createServerSupabaseAnonClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return jsonSuccess({ ok: true });
  }

  const supabase = createServerSupabaseAnonClient();
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.personal_email, {
    redirectTo: `${baseUrl}/reset`
  });

  return jsonSuccess({ ok: true });
}

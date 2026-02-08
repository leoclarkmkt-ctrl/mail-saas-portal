import { NextRequest } from "next/server";
import { renewSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clearUserSession, getUserSession } from "@/lib/auth/user-session";
import { jsonError, jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }
  const body = await request.json();
  const parsed = renewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid input", 400);
  }

  const supabase = createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", session.userId)
    .single();
  if (profileError) {
    return jsonError(profileError.message, 400);
  }
  if (profile?.is_suspended) {
    clearUserSession();
    return jsonError("Account suspended", 403);
  }
  const { data, error } = await supabase.rpc("renew_with_code", {
    p_user_id: session.userId,
    p_code: parsed.data.activation_code
  });

  if (error) {
    return jsonError(error.message ?? "Renew failed", 400);
  }

  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_renew"
  });

  return jsonSuccess({
    ok: true,
    renewed: true,
    enabled: true,
    expires_at: data?.[0]?.expires_at
  });
}

import { NextRequest } from "next/server";
import { renewSchema } from "@/lib/validation/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clearUserSession, requireUserSession } from "@/lib/auth/user-session";
import { jsonSuccess } from "@/lib/utils/api";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const errorResponse = (key: string, status: number) =>
    NextResponse.json({ ok: false, error: { key } }, { status });
  const session = await requireUserSession();
  if (!session) {
    return errorResponse("unauthorized", 401);
  }
  const body = await request.json();
  const parsed = renewSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_input", 400);
  }

  const supabase = createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (profileError) {
    console.error("[dashboard][renew] profile_lookup_failed", profileError);
    return errorResponse("internal_error", 500);
  }
  if (!profile) {
    return errorResponse("profile_not_found", 404);
  }
  if (profile?.is_suspended) {
    clearUserSession();
    return errorResponse("account_suspended", 403);
  }
  const { data, error } = await supabase.rpc("renew_with_code", {
    p_user_id: session.userId,
    p_code: parsed.data.activation_code
  });

  if (error) {
    console.error("[dashboard][renew] rpc_failed", error);
    return errorResponse("renew_failed", 400);
  }

  await supabase.from("audit_logs").insert({
    user_id: session.userId,
    action: "user_renew"
  });

  return jsonSuccess({
    ok: true,
    renewed: true,
    enabled: data?.[0]?.enabled ?? true,
    expires_at: data?.[0]?.expires_at
  });
}

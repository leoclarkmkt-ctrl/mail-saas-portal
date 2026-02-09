import { NextResponse } from "next/server";

import { getUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonSuccess } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getUserSession();
  if (!session || session.mode !== "personal") {
    return jsonSuccess({ ok: true, active: false, expired: true });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("edu_accounts")
    .select("expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return jsonSuccess({ ok: true, active: false, expired: true });
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const expired = !expiresAt || expiresAt <= new Date();
  const active = data.status === "active" && !expired;

  return jsonSuccess({ ok: true, active, expired });
}

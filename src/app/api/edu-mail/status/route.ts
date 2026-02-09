import { NextResponse } from "next/server";

import { requireUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const respond = (data: { ok: boolean; active: boolean; expired: boolean }) => {
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const session = await requireUserSession();
  if (!session || session.mode !== "personal") {
    return respond({ ok: true, active: false, expired: true });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("edu_accounts")
    .select("expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return respond({ ok: true, active: false, expired: true });
  }

  const expiresAtMs = data.expires_at ? Date.parse(data.expires_at) : NaN;
  const expired = Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
  const active = data.status === "active" && !expired;

  return respond({ ok: true, active, expired });
}

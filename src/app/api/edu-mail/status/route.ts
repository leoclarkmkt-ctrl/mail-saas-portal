import { NextResponse } from "next/server";

import { getUserSession } from "@/lib/auth/user-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const respond = (data: { ok: boolean; active: boolean; expired: boolean }) => {
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const session = await getUserSession();
  if (!session || session.mode !== "personal") {
    // 防枚举：统一返回 ok=true，但 active=false
    return respond({ ok: true, active: false, expired: true });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("edu_accounts")
    .select("expires_at, status")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error || !data) {
    // 可选：需要线上排查时打开这行（只打到 Vercel logs，不返回给前端）
    // console.warn("[edu-mail/status] missing record", { userId: session.userId, error: error?.message });

    return respond({ ok: true, active: false, expired: true });
  }

  const expiresAtMs = data.expires_at ? Date.parse(data.expires_at) : NaN;
  const expired = !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();
  const active = data.status === "active" && !expired;

  return respond({ ok: true, active, expired });
}

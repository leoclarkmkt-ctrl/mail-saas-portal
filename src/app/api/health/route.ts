import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getEnvStatus } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  const isAdmin = Boolean(session);

  const envStatus = getEnvStatus();
  const missing = envStatus.missing;
  const envOk = envStatus.ok;

  const appBaseUrl = process.env.APP_BASE_URL ?? "";
  const strictAuth = process.env.HEALTH_AUTH_STRICT === "1";
  const mode = strictAuth ? "auth-strict" : "db-first";

  const responseHeaders = { "Cache-Control": "no-store" };

  // ───────────────────────────────────────────────────────────
  // 1) Env guard (hard gate)
  // ───────────────────────────────────────────────────────────
  if (!envOk) {
    if (!isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          env: { ok: false },
          supabase: {
            ok: false,
            authOk: false,
            dbOk: false,
            mode
          },
          app_base_url: appBaseUrl,
          time: new Date().toISOString()
        },
        { headers: responseHeaders }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        env: { ok: false, missing },
        supabase: {
          ok: false,
          authOk: false,
          dbOk: false,
          mode
        },
        app_base_url: appBaseUrl,
        time: new Date().toISOString()
      },
      { headers: responseHeaders }
    );
  }

  const supabase = createServerSupabaseClient();

  // ───────────────────────────────────────────────────────────
  // 2) Auth probe (informational by default)
  // ───────────────────────────────────────────────────────────
  let authOk = false;

  try {
    const authResult = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    authOk = !authResult.error;
  } catch (error) {
    authOk = false;
  }

  // ───────────────────────────────────────────────────────────
  // 3) DB probe (authoritative in db-first mode)
  // ───────────────────────────────────────────────────────────
  let dbOk = false;

  try {
    const profilesQuery = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1);

    const codesQuery = await supabase
      .from("activation_codes")
      .select("code")
      .limit(1);

    dbOk = !profilesQuery.error && !codesQuery.error;
  } catch (error) {
    dbOk = false;
  }

  // ───────────────────────────────────────────────────────────
  // 4) Mode switch (db-first vs auth-strict)
  // ───────────────────────────────────────────────────────────
  const supabaseOk = strictAuth ? authOk && dbOk : dbOk;
  const ok = envOk && supabaseOk;

  // ───────────────────────────────────────────────────────────
  // 5) Public response
  // ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return NextResponse.json(
      {
        ok,
        env: { ok: envOk },
        supabase: {
          ok: supabaseOk,
          authOk,
          dbOk,
          mode
        },
        app_base_url: appBaseUrl,
        time: new Date().toISOString()
      },
      { headers: responseHeaders }
    );
  }

  // ───────────────────────────────────────────────────────────
  // 6) Admin response (verbose)
  // ───────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      ok,
      env: { ok: envOk, missing },
      supabase: {
        ok: supabaseOk,
        authOk,
        dbOk,
        mode
      },
      app_base_url: appBaseUrl,
      time: new Date().toISOString()
    },
    { headers: responseHeaders }
  );
}

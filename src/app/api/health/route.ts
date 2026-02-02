import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus, getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const envStatus = getEnvStatus();
  if (!envStatus.ok) {
    return NextResponse.json({
      ok: false,
      missing_env: envStatus.missing,
      supabase: "fail",
      schema: "unknown",
      auth_redirect_hint: "Set Supabase Auth URL Configuration: Site URL = APP_BASE_URL, Redirect URLs include APP_BASE_URL/reset, APP_BASE_URL/login, APP_BASE_URL/dashboard."
    });
  }

  const { APP_BASE_URL } = getServerEnv();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("activation_codes").select("code").limit(1);

  if (error) {
    const schemaMissing = /relation .* does not exist|permission denied|schema cache/i.test(
      error.message
    );
    return NextResponse.json({
      ok: false,
      missing_env: [],
      supabase: "fail",
      schema: schemaMissing ? "missing" : "unknown",
      auth_redirect_hint: `Set Supabase Auth URL Configuration: Site URL = ${APP_BASE_URL}, Redirect URLs include ${APP_BASE_URL}/reset, ${APP_BASE_URL}/login, ${APP_BASE_URL}/dashboard.`,
      message: schemaMissing
        ? "Database schema missing. Please run supabase/schema.sql."
        : error.message
    });
  }

  return NextResponse.json({
    ok: true,
    missing_env: [],
    supabase: "ok",
    schema: "ok",
    auth_redirect_hint: `Set Supabase Auth URL Configuration: Site URL = ${APP_BASE_URL}, Redirect URLs include ${APP_BASE_URL}/reset, ${APP_BASE_URL}/login, ${APP_BASE_URL}/dashboard.`
  });
}

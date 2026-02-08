import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getEnvStatus, getMailcowEnvStatus } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  const isAdmin = Boolean(session);

  const safeMessage = (value: unknown) => {
    const message = value instanceof Error ? value.message : String(value);
    return message.length > 200 ? message.slice(0, 200) : message;
  };

  const envStatus = getEnvStatus();
  const missing = envStatus.missing;
  const envOk = envStatus.ok;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const appBaseUrl = process.env.APP_BASE_URL ?? "";
  const mailcowEnv = getMailcowEnvStatus();

  const responseHeaders = { "Cache-Control": "no-store" };

  // Missing envs: keep public response minimal, admin response verbose.
  if (!envOk) {
    if (!isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          time: new Date().toISOString()
        },
        { headers: responseHeaders }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        env: { ok: false, missing },
        mailcow: { ok: mailcowEnv.ok, missing: mailcowEnv.missing },
        supabase: {
          ok: false,
          url: supabaseUrl,
          authOk: false,
          dbOk: false,
          schemaHints: ["Missing environment variables."]
        },
        app_base_url: appBaseUrl,
        time: new Date().toISOString()
      },
      { headers: responseHeaders }
    );
  }

  const supabase = createServerSupabaseClient();

  // Auth probe (informational unless strict mode enabled)
  let authOk = false;
  let authStatus: "ok" | "unavailable" | "error" = "unavailable";
  let authHint: string | undefined;

  try {
    const authResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    authOk = !authResult.error;
    authStatus = authOk ? "ok" : "unavailable";
    if (authResult.error) authHint = safeMessage(authResult.error.message);
  } catch (error) {
    authOk = false;
    authStatus = "error";
    authHint = safeMessage(error);
  }

  // DB probe (authoritative in db-first mode)
  const schemaHints: string[] = [];
  let dbOk = false;
  const schemaMissingRegex = /relation .* does not exist|schema cache|permission denied/i;

  try {
    const profilesQuery = await supabase.from("profiles").select("id").limit(1);
    const codesQuery = await supabase.from("activation_codes").select("code").limit(1);

    if (profilesQuery.error || codesQuery.error) {
      const errors = [profilesQuery.error, codesQuery.error].filter(Boolean);
      errors.forEach((err) => {
        if (err && schemaMissingRegex.test(err.message)) {
          schemaHints.push("schema missing: run supabase/schema.sql + migrations");
        } else if (err) {
          schemaHints.push(safeMessage(err.message));
        }
      });
      dbOk = false;
    } else {
      dbOk = true;
    }
  } catch (error) {
    dbOk = false;
    schemaHints.push(safeMessage(error));
  }

  const mailcowOk = mailcowEnv.ok;
  const mailcowError = mailcowEnv.ok
    ? "Mailcow check skipped (deprecated)"
    : "Missing Mailcow environment variables";

  // Mode switch
  const strictAuth = process.env.HEALTH_AUTH_STRICT === "1";
  const supabaseOk = strictAuth ? authOk && dbOk : dbOk;
  const ok = envOk && supabaseOk;

  // Public response
  if (!isAdmin) {
    return NextResponse.json(
      {
        ok,
        supabase: {
          ok: supabaseOk,
          authOk,
          authStatus,
          dbOk
        },
        app_base_url: appBaseUrl,
        time: new Date().toISOString()
      },
      { headers: responseHeaders }
    );
  }

  // Admin response
  return NextResponse.json(
    {
      ok,
      env: { ok: envOk, missing },
      mailcow: {
        ok: mailcowOk,
        error: mailcowError,
        missing: mailcowEnv.ok ? undefined : mailcowEnv.missing
      },
      supabase: {
        ok: supabaseOk,
        url: supabaseUrl,
        authOk,
        authStatus,
        dbOk,
        schemaHints: schemaHints.length > 0 ? schemaHints : undefined,
        authHint: authHint ?? undefined,
        mode: strictAuth ? "auth-strict" : "db-first"
      },
      app_base_url: appBaseUrl,
      time: new Date().toISOString()
    },
    { headers: responseHeaders }
  );
}

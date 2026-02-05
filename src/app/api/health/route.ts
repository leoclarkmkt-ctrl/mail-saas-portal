import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getEnvStatus, getMailcowEnvStatus } from "@/lib/env";
import { checkMailcowStatus } from "@/lib/mailcow";

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
  let authOk = false;
  let dbOk = false;
  const schemaHints: string[] = [];
  try {
    const randomId = crypto.randomUUID();
    const authResult = await supabase.auth.admin.getUserById(randomId);
    authOk = !authResult.error;
    if (authResult.error) {
      schemaHints.push(safeMessage(authResult.error.message));
    }
  } catch (error) {
    authOk = false;
    schemaHints.push(safeMessage(error));
  }

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

  let mailcowOk = false;
  let mailcowError: string | undefined;
  if (mailcowEnv.ok) {
    const mailcowStatus = await checkMailcowStatus();
    mailcowOk = mailcowStatus.ok;
    if (!mailcowStatus.ok) {
      mailcowError = mailcowStatus.error ?? "Mailcow unavailable";
    }
  } else {
    mailcowOk = false;
    mailcowError = "Missing Mailcow environment variables";
  }

  const ok = envOk && dbOk && mailcowOk;
  if (!isAdmin) {
    return NextResponse.json(
      {
        ok,
        supabase: {
          ok: dbOk,
          dbOk
        },
        app_base_url: appBaseUrl,
        time: new Date().toISOString()
      },
      { headers: responseHeaders }
    );
  }
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
        ok: dbOk,
        url: supabaseUrl,
        authOk,
        dbOk,
        schemaHints: schemaHints.length > 0 ? schemaHints : undefined
      },
      app_base_url: appBaseUrl,
      time: new Date().toISOString()
    },
    { headers: responseHeaders }
  );
}

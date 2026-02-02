import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const safeMessage = (value: unknown) => {
    const message = value instanceof Error ? value.message : String(value);
    return message.length > 200 ? message.slice(0, 200) : message;
  };

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SESSION_SECRET",
    "APP_BASE_URL"
  ];
  const missing = required.filter((key) => !process.env[key]);
  const envOk = missing.length === 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const responseHeaders = { "Cache-Control": "no-store" };

  if (!envOk) {
    return NextResponse.json(
      {
        ok: false,
        env: { ok: false, missing },
        supabase: {
          ok: false,
          url: supabaseUrl,
          authOk: false,
          dbOk: false,
          schemaHints: ["Missing environment variables."]
        },
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

  const ok = envOk && dbOk;
  return NextResponse.json(
    {
      ok,
      env: { ok: envOk, missing },
      supabase: {
        ok: dbOk,
        url: supabaseUrl,
        authOk,
        dbOk,
        schemaHints: schemaHints.length > 0 ? schemaHints : undefined
      },
      time: new Date().toISOString()
    },
    { headers: responseHeaders }
  );
}
